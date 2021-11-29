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
      db.createObjectStore("dbMetaData", {
        keyPath: "dbName",
      });

      db.createObjectStore("indexedCols", {
        keyPath: "collection",
      });
    },
  });

  openConnection = db;

  return openConnection;
};
