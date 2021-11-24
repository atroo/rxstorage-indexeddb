import {
  RxDocumentData,
  RxStorageChangeEvent,
  RxStorageInstance,
} from "rxdb/dist/types/types";
import { Subject } from "rxjs";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";

let instanceId = 1;

export class RxStorageBrowserInstance<RxDocType>
  implements
    RxStorageInstance<
      RxDocType,
      BrowserStorageInternals,
      BrowserStorageSettings
    >
{
  public readonly primaryPath: keyof RxDocType;
  private changes$: Subject<RxStorageChangeEvent<RxDocumentData<RxDocType>>> =
    new Subject();
  public readonly instanceId = instanceId++;
  private closed = false;
}
