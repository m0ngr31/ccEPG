import axios from 'axios';
import moment from 'moment';

import {userAgent} from './user-agent';
import {IChannel, IEntry} from './shared-interfaces';
import {db} from './database';
import {miscDbHandler} from './misc-db';

interface IPeacockChannel {
  id: string;
  gracenoteId: string;
  scheduleItems: IPeacockEvent[];
  serviceKey: string;
  logo: {
    Default: string;
  };
  name: string;
  type: string;
  epgNumber: number;
}

interface IPeacockRes {
  channels: IPeacockChannel[];
}

interface IPeacockEvent {
  id: string;
  channelId: string;
  startTimeUTC: number;
  durationSeconds: number;
  airingType: string;
  data: {
    type: string;
    title: string;
    description: string;
    episodeNumber: number;
    seasonNumber: number;
    images: {
      '16-9': string;
    };
  };
}

const parseChannels = async (channels: IPeacockChannel[]): Promise<void> => {
  for (const channel of channels) {
    const channelExists = await db.channels.findOne<IChannel>({id: channel.id});

    const channelData: Partial<IChannel> = {
      epgNumber: channel.epgNumber,
      from: 'Peacock',
      gracenoteId: channel.gracenoteId,
      id: channel.id,
      image: channel.logo.Default.replace('{width}', '360').replace('{height}', '270'),
      name: channel.name,
      type: channel.type.indexOf('linear') > -1 ? 'linear' : 'vod',
      url: `https://www.peacocktv.com/watch/playback/live/${channel.serviceKey}`,
    };

    if (!channelExists) {
      console.log('Adding channel: ', channel.name);

      const numChannels = await db.channels.count({});

      await db.channels.insert<IChannel>({
        ...channelData,
        enabled: true,
        number: numChannels + 1,
      } as IChannel);
    } else {
      await db.channels.update<IChannel>(
        {id: channel.id},
        {
          $set: channelData,
        },
      );
    }
  }
};

const parseAirings = async (events: IPeacockEvent[]): Promise<void> => {
  const now = moment();
  const endSchedule = moment().add(2, 'days').endOf('day');

  for (const event of events) {
    if (!event || !event.id) {
      return;
    }

    const entryExists = await db.entries.findOne<IEntry>({id: `${event.id}-${event.startTimeUTC}`});

    if (!entryExists) {
      const start = moment(event.startTimeUTC * 1000);
      const end = moment(start).add(event.durationSeconds, 'seconds');

      if (end.isBefore(now) || start.isAfter(endSchedule)) {
        continue;
      }

      console.log('Adding event: ', event.data.title);

      await db.entries.insert<IEntry>({
        categories: ['Peacock'],
        channelId: event.channelId,
        descripion: event.data.description,
        duration: end.diff(start, 'seconds'),
        end: end.valueOf(),
        id: `${event.id}-${event.startTimeUTC}`,
        image: event.data.images['16-9'],
        name: event.data.title,
        network: 'Peacock',
        newEpisode: event.airingType === 'New',
        start: start.valueOf(),
      });
    }
  }
};

class PeacockHandler {
  // No-op
  public initialize = async (): Promise<void> => {
    if (!(await this.getUsePeacock())) {
      return;
    }
  };

  // No-op
  public refreshTokens = async (): Promise<void> => {
    if (!(await this.getUsePeacock())) {
      return;
    }
  };

  public getSchedule = async (): Promise<void> => {
    if (!(await this.getUsePeacock())) {
      return;
    }

    console.log('Looking for Peacock events...');

    const entries: IPeacockEvent[] = [];

    try {
      const data = await this.getChannels();

      for (const channel of data.channels) {
        for (const event of channel.scheduleItems) {
          entries.push({
            ...event,
            channelId: channel.id,
          });
        }
      }

      await parseAirings(entries);
    } catch (e) {
      console.error(e);
      console.log('Could not parse Peacock events');
    }
  };

  public getChannels = async (): Promise<IPeacockRes> => {
    try {
      const now = moment();

      // Peacock requires time to be rounded to the neareset 5 minutes
      now.minutes(Math.round(now.minutes() / 5) * 5);

      if (now.minutes() === 60) {
        now.minutes(0);
        now.subtract(1, 'hour');
      }

      now.subtract(1, 'hour');

      now.seconds(0);
      now.milliseconds(0);

      const url = [
        'https://',
        'bff-ext.clients.peacocktv.com',
        '/bff/channel_guide',
        '?startTime=',
        now.format('YYYY-MM-DDTHH:mmZ'),
        '&contentSegments=D2C,Free',
      ].join('');

      const {data} = await axios.get<IPeacockRes>(url, {
        headers: {
          'X-SkyOTT-Device': 'COMPUTER',
          'X-SkyOTT-Language': 'en',
          'X-SkyOTT-Platform': 'PC',
          'X-SkyOTT-Proposition': 'NBCUOTT',
          'X-SkyOTT-Territory': 'US',
          'user-agent': userAgent,
        },
      });

      const channels: IPeacockChannel[] = [];

      for (const channel of data.channels) {
        channels.push(channel);
      }

      await parseChannels(channels);

      return data;
    } catch (error) {
      console.error(error);
      console.log('Error getting Peacock channels');
    }
  };

  private getUsePeacock = async (): Promise<boolean> => miscDbHandler.canUseNetwork('peacock');
}

export const peacockHandler = new PeacockHandler();
