import {
  hash,
  MangoQuery,
  RxJsonSchema,
  RxStorage,
  RxStorageStatics,
} from "rxdb";
import {
  RxKeyObjectStorageInstanceCreationParams,
  RxStorageInstanceCreationParams,
} from "rxdb/dist/types/types/rx-storage";
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
