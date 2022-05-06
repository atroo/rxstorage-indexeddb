import { IDBPCursorWithValue, IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { getDbMeta } from "./db-meta-helpers";
import { generateKeyRange } from "./idb-key-range";
import { generatePouchKeyRange } from "./pouch-key-range";
const { filterInMemoryFields } = require("pouchdb-selector-core");

// TODO: types

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  databaseName: string,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const metaDB = await getDbMeta();
  const indexesMeta = await metaDB.get("indexedCols", [
    databaseName,
    collectionName,
  ]);

  const indexedCols = indexesMeta ? indexesMeta.indexes : [];
  const pouchKeyRangeData = generatePouchKeyRange(query, indexedCols);

  const store = db.transaction(collectionName, "readonly").store;
  let cursor: IDBPCursorWithValue<
    unknown,
    ArrayLike<any>,
    string,
    unknown,
    "readonly"
  > | null;
  if (
    pouchKeyRangeData.field &&
    pouchKeyRangeData.queryOpts &&
    !pouchKeyRangeData.notIndexed
  ) {
    const keyRange = generateKeyRange(pouchKeyRangeData.queryOpts);
    const index = pouchKeyRangeData.primary
      ? store
      : store.index(pouchKeyRangeData.field);
    cursor = await index.openCursor(keyRange);
  } else {
    cursor = await store.openCursor();
  }

  let rows = await getRows(cursor);

  /**
   * Filter in Memory Fields will take care of sort, limit and skip.
   * TODO: if there's indexed field, then use IDBKeyRange to sort data.
   */

  rows = filterInMemoryFields(
    rows.map((row) => {
      // make data compatible with filterInMemoryFields
      // TODO: fork "pouchdb-selector-core" and adapt lib for our uses case.
      return { doc: row };
    }),
    query,
    pouchKeyRangeData.inMemoryFields
  );
  return rows.map((row) => {
    return row.doc;
  });
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
