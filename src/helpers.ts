import { openDB } from "idb";
import { RxJsonSchema } from "rxdb";
import { CompositePrimaryKey, PrimaryKey } from "rxdb/dist/types/types";
import { BrowserStorageState } from "./types/browser-storeage-state";

export const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";

const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState> = new Map();

/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */
export const getIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: RxJsonSchema<RxDocType>
) => {
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  let version = schema.version;
  if (dbState) {
    const newCollectionAdded =
      dbState.collections.indexOf(collectionName) === -1;
    if (newCollectionAdded) {
      dbState.upgradeVersion += 1;
    }

    version += dbState.upgradeVersion;

    if (dbState.version === version) {
      /**
       * nothing has changed. no need to create new connection
       */
      return dbState;
    } else {
      dbState.db.close();
    }
  }

  const db = await openDB(`${databaseName}.db`, version, {
    upgrade(db) {
      const store = db.createObjectStore(collectionName, {
        keyPath: primaryPath,
      });

      /**
       * Construct loki indexes from RxJsonSchema indexes.
       * TODO what about compound indexes?
       */
      const indices: string[] = [];
      if (schema.indexes) {
        schema.indexes.forEach((idx) => {
          if (!Array.isArray(idx)) {
            indices.push(idx);
          }
        });
      }

      indices.forEach((idxName) => {
        store.createIndex(idxName, idxName);
      });

      const changesCollectionName = collectionName + CHANGES_COLLECTION_SUFFIX;
      const changesStore = db.createObjectStore(changesCollectionName, {
        keyPath: "eventId",
      });
      changesStore.createIndex("sequence", "sequence");
    },
    blocked() {
      alert("Please close all other tabs with this site open!");
    },
    blocking() {
      // Make sure to add a handler to be notified if another page requests a version
      // change. We must close the database. This allows the other page to upgrade the database.
      // If you don't do this then the upgrade won't happen until the user closes the tab.
      //
      //   db.close();
      //   alert(
      //     "A new version of this page is ready. Please reload or close this tab!"
      //   );
    },
    terminated() {},
  });

  const newDbState: BrowserStorageState = {
    db,
    collections: dbState
      ? dbState.collections.concat(collectionName)
      : [collectionName],
    upgradeVersion: dbState ? dbState.upgradeVersion : 0,
    version,
  };

  IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);

  return newDbState;
};

export function getPrimaryFieldOfPrimaryKey<RxDocType>(
  primaryKey: PrimaryKey<RxDocType>
): keyof RxDocType {
  if (typeof primaryKey === "string") {
    return primaryKey as any;
  } else {
    return (primaryKey as CompositePrimaryKey<RxDocType>).key;
  }
}
