import fs from 'fs';

import {configPath} from './config';
import {entriesDb, initializeEntries, channelsDb, initializeChannels, miscDb, initializeMisc} from './database';

export const initDirectories = (): void => {
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath);
  }

  if (!fs.existsSync(entriesDb)) {
    initializeEntries();
  }

  if (!fs.existsSync(channelsDb)) {
    initializeChannels();
  }

  if (!fs.existsSync(miscDb)) {
    initializeMisc();
  }
};
