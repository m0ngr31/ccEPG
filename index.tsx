import {Context, Hono} from 'hono';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {BlankEnv, BlankInput} from 'hono/types';
import {html} from 'hono/html';

import {generateM3u} from './services/generate-m3u';
import {initDirectories} from './services/init-directories';
import {generateXml} from './services/generate-xmltv';
import {scheduleEntries} from './services/build-schedule';
import {cleanEntries} from './services/shared-helpers';
import {SERVER_PORT} from './services/port';
import { miscDbHandler } from './services/misc-db';
import { db } from './services/database';
import { IChannel, IMisc } from './services/shared-interfaces';

import {peacockHandler} from './services/peacock-handler';
import {abcHandler} from './services/abc-handler';

import { Layout } from './views/Layout';
import { Header } from './views/Header';
import {Main} from './views/Main';
import { Links } from './views/Links';
import { Prefix } from './views/Prefix';
import {Providers} from './views/Providers';
import {Provider} from './views/Provider';
import {Style} from './views/Style';
import {Script} from './views/Script';

import {version} from './package.json';

const PROVIDER_MAP = {
  ABC: abcHandler,
  Peacock: peacockHandler,
} as const;

const notFound = (c: Context<BlankEnv, '', BlankInput>) => c.text('404 not found', 404, {});

const shutDown = () => process.exit(0);

const schedule = async () => {
  console.log('=== Getting events ===');
  await peacockHandler.getSchedule();
  await abcHandler.getSchedule();

  console.log('=== Done getting events ===');
  await cleanEntries();
  console.log('=== Building the schedule ===');
  await scheduleEntries();
  console.log('=== Done building the schedule ===');
};

const app = new Hono();

app.use('/node_modules/*', serveStatic({root: './'}));

app.get('/', async c => {
  // For Links
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  const host = c.req.header('host') || '';
  const fullDomain = `${protocol}://${host}`;

  // For Prefix
  const currentPrefix = await miscDbHandler.getCcPrefix();

  // For Providers
  const allChannels = await db.channels.find<IChannel>({});

  const peacock = await db.misc.findOne<IMisc>({key: 'peacock'});
  const peacockChannels = allChannels.filter(c => c.from.toLowerCase() === 'peacock');

  const abc = await db.misc.findOne<IMisc>({key: 'abc'});
  const abcChannels = allChannels.filter(c => c.from.toLowerCase() === 'abc');

  return c.html(
    html`<!DOCTYPE html>${(
        <Layout>
          <Header />
          <Main>
            <Links baseUrl={fullDomain} />
            <Prefix currentPrefix={currentPrefix} />
            <Providers>
              <Provider channels={peacockChannels} name="Peacock" enabled={peacock.value} />
              <Provider channels={abcChannels} name="ABC" enabled={abc.value} />
            </Providers>
          </Main>
          <Style />
          <Script />
        </Layout>
      )}`,
  );
});

app.put('/update-prefix', async c => {
  const body = await c.req.parseBody();
  const prefix = body.cc_prefix as string;

  let invalid = false;

  if (!prefix || prefix.length < 8) {
    invalid = true;
  } else {
    await miscDbHandler.setCcPrefix(prefix);
  }

  return c.html(
    <Prefix currentPrefix={prefix} invalid={invalid} />,
    200,
    {
      ...(invalid && {
        'HX-Trigger': `{"HXToast":{"type":"error","body":"Invalid URI"}}`,
      }),
    },
  );
});

app.put('/provider/toggle/:provider', async c => {
  const provider = c.req.param('provider');
  const body = await c.req.parseBody();
  const enabled = body['provider-enabled'] === 'on';

  await miscDbHandler.setCanUseNetwork(provider.toLowerCase(), enabled);

  if (enabled) {
    await PROVIDER_MAP[provider].getSchedule();
  }

  const regex = new RegExp(provider, 'i');
  const providerChannels = await db.channels.find<IChannel>({from: {$regex: regex}});

  return c.html(
    <Provider channels={providerChannels} name={provider} enabled={enabled} />,
    200,
    {
      ...(enabled && {
        'HX-Trigger': `{"HXToast":{"type":"success","body":"Successfully enabled ${provider}"}}`,
      }),
    },
  );
});

app.put('/channel/toggle/:id', async c => {
  const channelId = c.req.param('id');
  const body = await c.req.parseBody();
  const enabled = body['channel-enabled'] === 'on';

  const {name} = await db.channels.update<IChannel>({id: channelId}, {$set: {enabled}}, {returnUpdatedDocs: true});

  return c.html(
    <input
      hx-target="this"
      hx-swap="outerHTML"
      type="checkbox"
      checked={enabled ? true : false}
      data-enabled={enabled ? 'true': 'false'}
      hx-put={`/channel/toggle/${channelId}`}
      hx-trigger="change"
      name="channel-enabled"
    />,
    200,
    {
      ...(enabled && {
        'HX-Trigger': `{"HXToast":{"type":"success","body":"Successfully enabled ${name}"}}`,
      }),
    },
  );
});

app.get('/channels.m3u', async c => {
  const m3uFile = await generateM3u();

  if (!m3uFile) {
    return notFound(c);
  }

  return c.body(m3uFile, 200, {
    'Content-Type': 'application/x-mpegurl',
  });
});

app.get('/xmltv.xml', async c => {
  const xmlFile = await generateXml();

  if (!xmlFile) {
    return notFound(c);
  }

  return c.body(xmlFile, 200, {
    'Content-Type': 'application/xml',
  });
});

// 404 Handler
app.notFound(notFound);

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

(async () => {
  console.log(`=== ccEPG v${version} starting ===`);
  initDirectories();

  await peacockHandler.initialize();
  await peacockHandler.refreshTokens();

  await abcHandler.initialize();
  await abcHandler.refreshTokens();

  await schedule();

  console.log('=== Starting Server ===');
  serve(
    {
      fetch: app.fetch,
      port: SERVER_PORT,
    },
    () => console.log(`Server started on port ${SERVER_PORT}`),
  );
})();

// Check for events every 4 hours and set the schedule
setInterval(async () => {
  await schedule();
}, 1000 * 60 * 60 * 4);

// Check for updated refresh tokens 30 minutes
setInterval(async () => {
  await peacockHandler.refreshTokens();
  await abcHandler.refreshTokens();
}, 1000 * 60 * 30);
