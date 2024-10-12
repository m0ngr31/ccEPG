import xml from 'xml';
import moment from 'moment';

import {db} from './database';
import {IChannel, IEntry, IMisc} from './shared-interfaces';

const baseCategories = ['HD', 'HDTV'];

const formatCategories = (categories: string[] = []) =>
  [...new Set([...baseCategories, ...categories])].map(category => ({
    category: [
      {
        _attr: {
          lang: 'en',
        },
      },
      category,
    ],
  }));

export const generateXml = async (): Promise<xml> => {
  const wrap: any = {
    tv: [
      {
        _attr: {
          'generator-info-name': 'ccEPG',
        },
      },
    ],
  };

  const channels = await db.channels.find<IChannel>({}).sort({number: 1});

  for (const channel of channels) {
    const channelMiscDb = await db.misc.findOne<IMisc>({key: channel.from});

    if (!channel.enabled || !channelMiscDb || !channelMiscDb.value) {
      continue;
    }

    const channelNum = channel.number;

    wrap.tv.push({
      channel: [
        {
          _attr: {
            id: `${channelNum}.ccEPG`,
          },
        },
        {
          'display-name': [
            {
              _attr: {
                lang: 'en',
              },
            },
            channel.name,
          ],
        },
        {
          icon: [
            {
              _attr: {
                src: channel.gracenoteId
                  ? `https://tmsimg.fancybits.co/assets/s${channel.gracenoteId}_ll_h15_ab.png?w=360&h=270`
                  : channel.image,
              },
            },
          ],
        },
      ],
    });
  }

  const scheduledEntries = await db.entries
    .find<IEntry>({channel: {$exists: true}})
    .sort({start: 1});

  for (const entry of scheduledEntries) {
    const entryName = entry.name;

    wrap.tv.push({
      programme: [
        {
          _attr: {
            channel: `${entry.channel}.ccEPG`,
            start: moment(entry.start).format('YYYYMMDDHHmmss ZZ'),
            stop: moment(entry.end).format('YYYYMMDDHHmmss ZZ'),
          },
        },
        {
          title: [
            {
              _attr: {
                lang: 'en',
              },
            },
            entryName,
          ],
        },
        {
          video: {
            quality: 'HDTV',
          },
        },
        {
          desc: [
            {
              _attr: {
                lang: 'en',
              },
            },
            entry.descripion || entry.name,
          ],
        },
        {
          icon: [
            {
              _attr: {
                src: entry.image,
              },
            },
          ],
        },
        {
          live: [{}, ''],
        },
        ...(entry.newEpisode
          ? [
              {
                new: [{}, ''],
              },
            ]
          : []),
        ...formatCategories(entry.categories),
      ],
    });
  }

  return xml(wrap);
};
