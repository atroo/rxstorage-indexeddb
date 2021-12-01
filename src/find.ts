import { IDBPCursorWithValue, IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { translateMangoQuerySelector } from ".";
import { getDbMeta } from "./db-meta-helpers";
import { generateKeyRange } from "./idb-key-range";
const { filterInMemoryFields } = require("pouchdb-selector-core");

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const metaDB = await getDbMeta();
  const indexedCols = await metaDB.getAllFromIndex(
    "indexedCols",
    "dbNameCollection",
    IDBKeyRange.bound([db.name, collectionName], [db.name, collectionName])
  );
  const translatedSelector = translateMangoQuerySelector(query, indexedCols);

  let rows = [];
  const store = db.transaction(collectionName).store;
  if (translatedSelector.field && translatedSelector.queryOpts) {
    const keyRange = generateKeyRange(translatedSelector.queryOpts);
    const index = store.index(translatedSelector.field);
    const cursor = await index.openCursor(keyRange); // sort
    rows = await getRows(cursor, query.limit);
  } else {
    const cursor = await store.openCursor();
    rows = await getRows(cursor, query.limit);
  }

  if (translatedSelector.inMemoryFields.length) {
    rows = filterInMemoryFields(
      rows.map((row) => {
        // make data compatible with filterInMemoryFields
        // TODO: copy and change this util
        return { doc: row };
      }),
      query,
      translatedSelector.inMemoryFields
    );
  }

  return rows;
};

const getRows = async (
  cursor: IDBPCursorWithValue | null,
  limit = Infinity
) => {
  const rows = [];
  let i = 0;
  while (cursor && i < limit) {
    rows.push(cursor.value);
    i += 1;
    cursor = await cursor.continue();
  }

  return rows;
};
