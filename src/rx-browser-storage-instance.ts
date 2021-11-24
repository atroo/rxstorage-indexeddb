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
import { openDB } from "idb";

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
    public readonly internals: BrowserStorageInternals,
    public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {
    // this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }

  prepareQuery(mutateableQuery: MangoQuery<RxDocType>) {
    return mutateableQuery;
  }
}

export const createBrowserStorageLocalState = <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  //
};

export const createBrowserStorageInstance = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  const internals: BrowserStorageInternals = {};
};
