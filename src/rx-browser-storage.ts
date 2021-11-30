import { hash, RxStorage } from "rxdb";
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

export class RxBrowserStorage
  implements RxStorage<BrowserStorageInternals, BrowserStorageSettings>
{
  public name = "atroo-browser-storage";

  hash(data: Buffer | Blob | string): Promise<string> {
    return Promise.resolve(hash(data));
  }

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
