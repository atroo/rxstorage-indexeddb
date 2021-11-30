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
  changesCollectionName: string;
  updateNeeded: boolean;
  newCollections: Array<{
    collectionName: string;
    indexes: Array<string | string[]>;
    primaryPath: string | string[];
  }>;
  metaData: IMetaDB["dbMetaData"]["value"];
}

export interface IMetaDB extends DBSchema {
  dbMetaData: {
    key: string;
    value: {
      version: number;
      collections: string[];
      dbName: string;
    };
    indexes: {
      dbName: string;
    };
  };
  indexedCols: {
    key: string[];
    value: {
      dbName: string;
      name: string;
      value: string | string[];
      collection: string;
    };
    indexes: {
      dbNameCollection: string;
    };
  };
}
