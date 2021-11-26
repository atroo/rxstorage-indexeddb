import {
  MangoQuery,
  MangoQuerySortDirection,
  MangoQuerySortPart,
  RxDocumentData,
  RxDocumentWriteData,
  RxJsonSchema,
  RxStorageChangeEvent,
  RxStorageInstance,
  RxStorageInstanceCreationParams,
} from "rxdb/dist/types/types";
import { Subject } from "rxjs";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";
import {
  getIdbDatabase,
  getPrimaryFieldOfPrimaryKey,
  IDB_DATABASE_STATE_BY_NAME,
  newRxError,
} from "./db-helpers";
import {
  DeterministicSortComparator,
  QueryMatcher,
} from "event-reduce-js/dist/lib/types";
import { find } from "./find";
const { filterInMemoryFields } = require("pouchdb-selector-core");

let instanceId = 1;

export class RxStorageBrowserInstance<RxDocType>
  implements
    RxStorageInstance<
      RxDocType,
      BrowserStorageInternals,
      BrowserStorageSettings
    >
{
  //   public readonly primaryPath: keyof RxDocType;
  private changes$: Subject<RxStorageChangeEvent<RxDocumentData<RxDocType>>> =
    new Subject();
  public readonly instanceId = instanceId++;
  private closed = false;

  constructor(
    public readonly databaseName: string,
    public readonly collectionName: string,
    public readonly schema: Readonly<RxJsonSchema<RxDocType>>,
    public readonly internals: BrowserStorageInternals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {
    // this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }

  prepareQuery(mutateableQuery: MangoQuery<RxDocType>) {
    return mutateableQuery;
  }

  getSortComparator(query: MangoQuery<RxDocType>) {
    // TODO if no sort is given, use sort by primary.
    // This should be done inside of RxDB and not in the storage implementations.
    const sortOptions: MangoQuerySortPart<RxDocType>[] = query.sort
      ? (query.sort as any)
      : [
          {
            [this.internals.primaryPath]: "asc",
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
  }

  getQueryMatcher(query: MangoQuery<RxDocType>) {
    const fun: QueryMatcher<RxDocumentWriteData<RxDocType>> = (
      doc: RxDocumentWriteData<RxDocType>
    ) => {
      console.log("getQueryMatcher doc:", doc);
      const { _attachments, _deleted, _rev, ...json } = doc;
      const inMemoryFields = Object.keys(json);
      return filterInMemoryFields([json], query, inMemoryFields).length > 0;
    };

    return fun;
  }
}

export const createBrowserStorageLocalState = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  const primaryPath = getPrimaryFieldOfPrimaryKey(
    params.schema.primaryKey
  ).toString();
  const databaseState = await getIdbDatabase(
    params.databaseName,
    params.collectionName,
    primaryPath,
    params.schema
  );

  return {
    databaseState,
    primaryPath,
  };
};

export const createBrowserStorageInstance = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  const internals: BrowserStorageInternals =
    await createBrowserStorageLocalState(params);

  const instance = new RxStorageBrowserInstance(
    params.databaseName,
    params.collectionName,
    params.schema,
    internals
  );

  /**
   * TODO: should we do extra steps to enable CORRECT multiinstance?
   */

  return instance;
};
