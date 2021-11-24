import { BrowserStorageState } from "./browser-storeage-state";

export interface BrowserStorageInternals {
  localState?: BrowserStorageState;
  primaryPath: string;
}

export interface BrowserStorageSettings {}
