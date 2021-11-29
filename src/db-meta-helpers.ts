import { IDBPDatabase, openDB } from "idb";
import { IMetaDB } from "./types/browser-storeage-state";

let openConnection: IDBPDatabase<IMetaDB>;

export const getDbMeta = async () => {
  if (openConnection) {
    return openConnection;
  }

  const db = await openDB<IMetaDB>("rx-browser-storage-meta", 1, {
    upgrade: (db) => {
      // store version, collections
      const dbMetaDataStore = db.createObjectStore("dbMetaData", {
        keyPath: "dbName",
      });

      dbMetaDataStore.createIndex("dbName", "dbName");

      const indexedColsStore = db.createObjectStore("indexedCols", {
        keyPath: "collection",
      });

      indexedColsStore.createIndex("collection", "collection");
    },
    blocking: () => {
      db.close();
    },
  });

  openConnection = db;

  return openConnection;
};
