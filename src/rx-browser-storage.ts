import { DeterministicSortComparator } from "event-reduce-js";
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
  RxKeyObjectStorageInstanceCreationParams,
  RxStorageInstanceCreationParams,
} from "rxdb/dist/types/types/rx-storage";
import { getPrimaryFieldOfPrimaryKey, newRxError } from "./db-helpers";
import { createBrowserKeyObjectStorageInstance } from "./rx-browser-key-object-storage-instance";
import { createBrowserStorageInstance } from "./rx-browser-storage-instance";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";

const RxBrowserStorageStatics: RxStorageStatics = {
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
};

export class RxBrowserStorage
  implements RxStorage<BrowserStorageInternals, BrowserStorageSettings>
{
  public name = "atroo-browser-storage";
  public statics = RxBrowserStorageStatics;

  async createStorageInstance<RxDocType>(
    params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
  ) {
    return createBrowserStorageInstance(params);
  }

  public async createKeyObjectStorageInstance(
    params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageInternals>
  ) {
    params.collectionName = params.collectionName + "-key-object";
    return createBrowserKeyObjectStorageInstance(params);
  }
}

export function getRxSBrowserIdbStorage(
  databaseSettings: BrowserStorageSettings = {}
) {
  const storage = new RxBrowserStorage();
  return storage;
}
