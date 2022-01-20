import { DeterministicSortComparator, QueryMatcher } from "event-reduce-js";
import {
  hash,
  MangoQuery,
  MangoQuerySortDirection,
  MangoQuerySortPart,
  RxJsonSchema,
  RxStorage,
  RxStorageStatics,
} from "rxdb";
import {
  RxDocumentWriteData,
  RxKeyObjectStorageInstanceCreationParams,
  RxStorageInstanceCreationParams,
} from "rxdb/dist/types/types/rx-storage";
import { getPrimaryFieldOfPrimaryKey, newRxError } from "./db-helpers";
import { createBrowserKeyObjectStorageInstance } from "./rx-browser-key-object-storage-instance";
import { createBrowserStorageInstance } from "./rx-browser-storage-instance";
const { filterInMemoryFields } = require("pouchdb-selector-core");
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
  IdbSettings,
} from "./types/browser-storage";

const RxBrowserStorageStatics: RxStorageStatics = {
  hashKey: "md5",
  hash(data: Buffer | Blob | string): Promise<string> {
    return Promise.resolve(hash(data));
  },

  prepareQuery<RxDocType>(
    schema: RxJsonSchema<RxDocType>,
    mutateableQuery: MangoQuery<RxDocType>
  ) {
    return mutateableQuery;
  },

  getSortComparator<RxDocType>(
    schema: RxJsonSchema<RxDocType>,
    query: MangoQuery<RxDocType>
  ) {
    // TODO if no sort is given, use sort by primary.
    // This should be done inside of RxDB and not in the storage implementations.
    const sortOptions: MangoQuerySortPart<RxDocType>[] = query.sort
      ? (query.sort as any)
      : [
          {
            [getPrimaryFieldOfPrimaryKey(schema.primaryKey)]: "asc",
          },
        ];

    const fun: DeterministicSortComparator<RxDocType> = (
      a: RxDocType,
      b: RxDocType
    ) => {
      let compareResult: number = 0;
      sortOptions.forEach((sortPart) => {
        const fieldName: string = Object.keys(sortPart)[0];
        const direction: MangoQuerySortDirection = Object.values(sortPart)[0];
        const directionMultiplier = direction === "asc" ? 1 : -1;
        const valueA: any = (a as any)[fieldName];
        const valueB: any = (b as any)[fieldName];
        if (valueA === valueB) {
          return;
        } else {
          if (valueA > valueB) {
            compareResult = 1 * directionMultiplier;
          } else {
            compareResult = -1 * directionMultiplier;
          }
        }
      });

      /**
       * Two different objects should never have the same sort position.
       * We ensure this by having the unique primaryKey in the sort params
       * at this.prepareQuery()
       */
      if (!compareResult) {
        throw newRxError("SNH", { args: { query, a, b } });
      }

      return compareResult as 1 | -1;
    };

    return fun;
  },

  getQueryMatcher<RxDocType>(
    schema: RxJsonSchema<RxDocType>,
    query: MangoQuery<RxDocType>
  ) {
    const fun: QueryMatcher<RxDocumentWriteData<RxDocType>> = (
      doc: RxDocumentWriteData<RxDocType>
    ) => {
      const { _attachments, _deleted, _rev, ...json } = doc;
      const inMemoryFields = Object.keys(json);
      return filterInMemoryFields([json], query, inMemoryFields).length > 0;
    };

    return fun;
  },
};

export class RxBrowserStorage
  implements RxStorage<BrowserStorageInternals, IdbSettings>
{
  public name = "atroo-browser-storage";
  public statics = RxBrowserStorageStatics;

  constructor(public databaseSettings: IdbSettings) {}

  async createStorageInstance<RxDocType>(
    params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
  ) {
    return createBrowserStorageInstance(params, this.databaseSettings);
  }

  public async createKeyObjectStorageInstance(
    params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>
  ) {
    params.collectionName = params.collectionName + "-key-object";
    return createBrowserKeyObjectStorageInstance(params, this.databaseSettings);
  }
}

export function getRxIdbStorage(databaseSettings: IdbSettings = {}) {
  const storage = new RxBrowserStorage(databaseSettings);
  return storage;
}
