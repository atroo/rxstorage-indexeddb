import {
  RxDocumentData,
  RxJsonSchema,
  RxKeyObjectStorageInstanceCreationParams,
  RxStorageChangeEvent,
  RxStorageKeyObjectInstance,
} from "rxdb/dist/types/types";
import { Subject } from "rxjs";
import { getIdbDatabase } from "./db-helpers";
import { createBrowserStorageLocalState } from "./rx-browser-storage-instance";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";

let instanceId = 1;

export class RxStorageKeyObjectInstanceLoki<RxDocType>
  implements
    RxStorageKeyObjectInstance<BrowserStorageInternals, BrowserStorageSettings>
{
  private changes$: Subject<RxStorageChangeEvent<RxDocumentData<RxDocType>>> =
    new Subject();
  public readonly instanceId = instanceId++;
  private closed = false;

  constructor(
    public readonly databaseName: string,
    public readonly collectionName: string,
    public readonly options: Readonly<BrowserStorageSettings>,
    public readonly internals: BrowserStorageInternals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {
    // this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }
}

export async function createBrowserKeyValueStorageLocalState(
  params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>
) {
  const primaryPath = "_id";

  const databaseState = await getIdbDatabase(
    params.databaseName,
    params.collectionName,
    "_id",
    { indexes: [], version: 1 }
  );

  return {
    databaseState,
    primaryPath,
  };
}

export const createBrowserKeyObjectStorageInstance = async (
  params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>
) => {
  const internals: BrowserStorageInternals =
    await createBrowserKeyValueStorageLocalState(params);

  const instance = new RxStorageKeyObjectInstanceLoki(
    params.databaseName,
    params.collectionName,
    {},
    internals
  );

  /**
   * TODO: should we do extra steps to enable CORRECT multiinstance?
   */

  return instance;
};
