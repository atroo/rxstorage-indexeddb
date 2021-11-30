import { BrowserStorageState } from "./browser-storeage-state";

export interface BrowserStorageInternals {
  databaseState?: BrowserStorageState;
  primaryPath: string;
  changesCollectionName: string;
}

export interface BrowserStorageSettings {}
