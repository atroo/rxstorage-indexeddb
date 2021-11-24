import {
  MangoQuery,
  RxDocumentData,
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
import { getIdbDatabase, getPrimaryFieldOfPrimaryKey } from "./helpers";

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
