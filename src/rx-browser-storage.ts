import { hash, RxStorage } from "rxdb";
import {
  RxKeyObjectStorageInstanceCreationParams,
  RxStorageInstanceCreationParams,
} from "rxdb/dist/types/types/rx-storage";
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
    //
  }

  public async createKeyObjectStorageInstance(
    params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>
  ) {
    //
  }
}
