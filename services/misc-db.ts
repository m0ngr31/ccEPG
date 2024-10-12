import { db } from "./database";
import { IMisc } from "./shared-interfaces";

export const CC_PREFIX = 'http://localhost:5589';

class MiscDB {
  public getCcPrefix = async (): Promise<string> => {
    const prefix = await db.misc.findOne<IMisc>({key: 'ccPrefix'});

    if (!prefix) {
      await db.misc.insert({key: 'ccPrefix', value: CC_PREFIX});

      return CC_PREFIX;
    }

    return prefix.value;
  };

  public setCcPrefix = async (value: string): Promise<void> => {
    db.misc.update({key: 'ccPrefix'}, {$set: {value}});
  };

  public canUseNetwork = async (network: string): Promise<boolean> => {
    const networkObj = await db.misc.findOne<IMisc>({key: network});

    if (!networkObj) {
      await db.misc.insert({key: network, value: true});

      return true;
    }

    return networkObj.value as boolean;
  };

  public setCanUseNetwork = async (network: string, value: boolean): Promise<void> => {
    db.misc.update({key: network}, {$set: {value}});
  };
}

export const miscDbHandler = new MiscDB();
