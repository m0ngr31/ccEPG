import { db } from './database';
import { miscDbHandler } from './misc-db';
import { IChannel, IMisc } from './shared-interfaces';

export const generateM3u = async (): Promise<string> => {
  let m3uFile = '#EXTM3U';

  const prefix = await miscDbHandler.getCcPrefix();

  const channels = await db.channels.find<IChannel>({}).sort({ number: 1 }).exec();

  for (const channel of channels) {
    const channelMiscDb = await db.misc.findOne<IMisc>({key: channel.from});

    if (!channel.enabled || !channelMiscDb || !channelMiscDb.value) {
      continue;
    }

    m3uFile = `${m3uFile}\n#EXTINF:0 channel-id="${channel.name}" ${channel.gracenoteId ? `tvc-guide-stationid="${channel.gracenoteId}"` : ''} tvg-id="${channel.number}.ccEPG" channel-number="${channel.number}" tvg-chno="${channel.number}" tvg-name="${channel.name}" group-title="ccEPG", ccEPG ${channel.number}`;
    m3uFile = `${m3uFile}\n${prefix}/stream?url=${channel.url}\n`;
  }

  return m3uFile;
};
