import {db} from './database';
import {IEntry, IChannel} from './shared-interfaces';

export const scheduleEntries = async (): Promise<void> => {
  const unscheduledEntries = await db.entries.find<IEntry>({channel: {$exists: false}}).sort({start: 1});

  unscheduledEntries.length > 0 && console.log(`Scheduling ${unscheduledEntries.length} entries...`);

  for (const entry of unscheduledEntries) {
    const channel = await db.channels.findOne<IChannel>({id: entry.channelId});

    if (!channel) {
      console.log(`Channel ${entry.channelId} not found for entry ${entry.name}`);
      continue;
    }

    await db.entries.update<IEntry>({_id: entry._id}, {$set: {channel: channel.number}});
  }
};
