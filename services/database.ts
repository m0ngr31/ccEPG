import fs from 'fs';
import path from 'path';
import Datastore from 'nedb-promises';

import {configPath} from './config';

export const entriesDb = path.join(configPath, 'entries.db');
export const channelsDb = path.join(configPath, 'channels.db');
export const miscDb = path.join(configPath, 'misc.db');

export interface IDocument {
  _id: string;
}

export const db = {
  channels: Datastore.create(channelsDb),
  entries: Datastore.create(entriesDb),
  misc: Datastore.create(miscDb),
};

export const initializeEntries = (): void => fs.writeFileSync(entriesDb, '');
export const initializeChannels = (): void => fs.writeFileSync(channelsDb, '');
export const initializeMisc = (): void => fs.writeFileSync(miscDb, '');
