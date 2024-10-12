export interface IStringObj {
  [key: string]: string;
}
export interface IChannel {
  name: string;
  gracenoteId?: string;
  id: string;
  enabled: boolean;
  epgNumber?: number;
  type?: string;
  image: string;
  url: string;
  number?: number;
  from: string;
}

export interface IEntry {
  categories: string[];
  duration: number;
  end: number;
  id: string;
  image: string;
  name: string;
  network: string;
  start: number;
  channel?: number;
  channelName?: string;
  channelId: string;
  newEpisode?: boolean;
  descripion?: string;
}

export interface IMisc {
  key: string;
  value: any;
  meta: any;
}
