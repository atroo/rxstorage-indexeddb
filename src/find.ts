import { IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { translateMangoQuerySelector } from ".";
import { generateKeyRange } from "./idb-key-range";
import { IIdbKeyRangeOptions } from "./types/translate-mango-query";
const { filterInMemoryFields } = require("pouchdb-selector-core");

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const translatedSelector = translateMangoQuerySelector(query);

  // TODO: use indexed field to generate opts
  const firstIndexedField = translatedSelector.fields[0]; // TODO: can be undefined?
  const opts: IIdbKeyRangeOptions = {
    startkey: translatedSelector.queryOpts.startkey
      ? translatedSelector.queryOpts.startkey[0]
      : undefined,
    endkey: translatedSelector.queryOpts.endkey
      ? translatedSelector.queryOpts.endkey[0]
      : undefined,
    inclusive_start: translatedSelector.queryOpts.inclusive_start,
    inclusive_end: translatedSelector.queryOpts.inclusive_end,
  };

  const keyRange = generateKeyRange(opts);

  const store = db.transaction(collectionName).store;
  const index = store.index(firstIndexedField);
  let cursor = await index.openCursor(keyRange);

  let rows = [];
  while (cursor) {
    const key = cursor.key;
    const value = cursor.value;
    rows.push(value);
    cursor = await cursor.continue();
  }

  // TODO: currently that there should be single indexed key.
  // And everything else should be in memory fields.
  if (translatedSelector.fields.length > 1) {
    const inMemoryFields = translatedSelector.fields.slice(1);
    rows = filterInMemoryFields(rows, query, inMemoryFields);
  }

  return rows;
};
