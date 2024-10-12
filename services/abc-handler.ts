import axios from 'axios';
import moment from 'moment';

import {userAgent} from './user-agent';
import {IChannel, IEntry} from './shared-interfaces';
import {db} from './database';
import {miscDbHandler} from './misc-db';

interface IABCImage {
  value: string;
  format: string;
  width: number;
  height: number;
}

interface IABCChannel {
  id: string;
  title: string;
  urlValue: string;
  airings: IABCEventMin[];
  images: IABCImage[];
}

interface IABCRes {
  categories: {
    channels: IABCChannel[];
  }[];
  programs: IABCEvent[];
}

interface IABCEventMin {
  tmsid: string;
  duration: number;
  displayAirtime: string;
}

interface IABCEvent {
  tmsid: string;
  title: string;
  description: string;
  images: IABCImage[];
  genre: string;
  showTitle? : string;
  season: number;
  episode: number;
}

type IABCEventFull = IABCEventMin & IABCEvent;

interface IABCAirings {
  [key: string]: IABCEventFull;
}

interface IABCGeo {
  device: string;
  brand: string;
  ver: string;
  user: {
    allowed: boolean;
    zipcode: string;
  };
  affiliates: {
    affiliate: {
      name: string;
      logo: string;
      dma: string;
      isChannelAvailable: boolean;
    }[];
  };
}

const parseChannels = async (channels: IABCChannel[]): Promise<void> => {
  for (const channel of channels) {
    const channelExists = await db.channels.findOne<IChannel>({id: channel.id});

    if (!channelExists) {
      const channelName = channel.title.replace('Unlocked Channel: ', '').trim();

      console.log('Adding channel: ', channelName);

      const numChannels = await db.channels.count({});

      const image = channel.images
        ?.sort((a, b) => b.width - a.width)
        .find(img => img.format === 'png');

      await db.channels.insert<IChannel>({
        enabled: true,
        from: 'ABC',
        id: channel.id,
        image: image ? image.value : '',
        name: channelName,
        number: numChannels + 1,
        url: `https://abc.com${channel.urlValue}`,
      });
    }
  }
};

const parseAirings = async (events: IABCAirings): Promise<void> => {
  const now = moment();
  const endSchedule = moment().add(2, 'days').endOf('day');

  for (const channelId in events) {
    const event = events[channelId];

    if (!event || !event.tmsid) {
      return;
    }

    const entryExists = await db.entries.findOne<IEntry>({id: `${event.tmsid}-${event.displayAirtime}`});

    if (!entryExists) {
      const start = moment(event.displayAirtime);
      const end = moment(start).add(event.displayAirtime, 'milliseconds');

      if (end.isBefore(now) || start.isAfter(endSchedule)) {
        continue;
      }

      const eventName = (event.title || event.showTitle).trim();
      const image = event.images
        ?.sort((a, b) => b.width - a.width)
        .find(img => img.format === 'png');

      console.log('Adding event: ', eventName);

      await db.entries.insert<IEntry>({
        categories: ['ABC'],
        channelId,
        descripion: event.description,
        duration: end.diff(start, 'seconds'),
        end: end.valueOf(),
        id: `${event.tmsid}-${event.displayAirtime}`,
        image: image ? image.value : '',
        name: eventName,
        network: 'ABC',
        start: start.valueOf(),
      });
    }
  }
};

class ABCHandler {
  private geoData?: IABCGeo;

  // No-op
  public initialize = async (): Promise<void> => {
    if (!(await this.getUseABC())) {
      return;
    }
  };

  // No-op
  public refreshTokens = async (): Promise<void> => {
    if (!(await this.getUseABC())) {
      return;
    }
  };

  public getSchedule = async (): Promise<void> => {
    if (!(await this.getUseABC())) {
      return;
    }

    console.log('Looking for ABC events...');

    const entries: IABCAirings = {};

    try {
      const data = await this.getChannels();

      for (const category of data.categories) {
        for (const channel of category.channels) {
          for (const event of channel.airings) {
            const fullEntry = data.programs.find(p => p.tmsid === event.tmsid);

            if (fullEntry) {
              const fullEvent: IABCEventFull = {
                ...event,
                ...fullEntry,
              };

              entries[channel.id] = fullEvent;
            }
          }
        }
      }

      await parseAirings(entries);
    } catch (e) {
      console.error(e);
      console.log('Could not parse ABC events');
    }
  };

  public getChannels = async (): Promise<IABCRes> => {
    await this.getGeoData();

    try {
      const now = moment();
      const end = moment().add(2, 'days').endOf('day');

      const affiliate = this.geoData?.affiliates.affiliate.find(a => a.isChannelAvailable);

      const url = [
        'https://',
        'prod.gatekeeper.us-abc.symphony.edgedatg.com',
        '/api/ws/pluto/v1/module',
        '/categoryguide/4204541',
        '?brand=001',
        '&device=001',
        '&authlevel=0',
        '&layout=3897245',
        '&starttime=',
        now.format('YYYYMMDD-HHMM'),
        '&endtime=',
        end.format('YYYYMMDD'),
        '&offset=',
        now.format('ZZ'),
        '&affiliate=',
        affiliate.name,
        '&urlObfuscation=true',
      ].join('');

      const {data} = await axios.get<IABCRes>(url, {
        headers: {
          'user-agent': userAgent,
        },
      });

      const channels: IABCChannel[] = [];

      for (const category of data.categories) {
        for (const channel of category.channels) {
          channels.push(channel);
        }
      }

      await parseChannels(channels);

      return data;
    } catch (error) {
      console.error(error);
      console.log('Error getting ABC channels');
    }
  };

  private getGeoData = async (): Promise<void> => {
    try {
      const url = ['https://', 'prod.gatekeeper.us-abc.symphony.edgedatg.go.com', '/vp2/ws/utils', '/2021/geo/video/geolocation', '/001/001/gt/-1.jsonp'].join('');

      const {data} = await axios.get<IABCGeo>(url, {
        headers: {
          'user-agent': userAgent,
        },
      });

      this.geoData = data;
    } catch (e) {
      console.error(e);
      console.log('Could not get ABC geo data');
    }
  };

  private getUseABC = async (): Promise<boolean> => miscDbHandler.canUseNetwork('abc');
}

export const abcHandler = new ABCHandler();
