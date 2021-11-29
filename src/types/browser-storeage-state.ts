import { DBSchema, IDBPDatabase } from "idb";

/**
 * @param {number} upgradeVersion Will increment every time new collection are added.
 *  Reason: new collections can be added only via "upgrade" callback.
 * @param {number} version Compound value from upgrade version and schema version.
 *  Can be used to detect migrations.
 */
export interface BrowserStorageState {
  getDb: () => Promise<IDBPDatabase<unknown>>;
  db?: IDBPDatabase<unknown>;
  collections: string[];
  upgradeVersion: number;
  version: number;
  changesCollectionName: string;
  meta: Array<{
    collectionName: string;
    indexes: Array<string | string[]>;
    primaryPath: string | string[];
  }>;
}

export interface IMetaDB extends DBSchema {
  dbMetaData: {
    key: string;
    value: {
      version: number;
      collections: string[];
    };
  };
  indexedCols: {
    key: string[];
    value: {
      name: string;
      value: string;
    };
  };
}
