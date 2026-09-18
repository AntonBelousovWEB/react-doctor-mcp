import type { DiagnoseOptions, DiagnoseResult } from "react-doctor/api";
import type { AppConfig } from "../config.js";

export interface DiagnoseDirectory {
  (directory: string, options?: DiagnoseOptions): Promise<DiagnoseResult>;
}

export interface CachedScan {
  readonly result: DiagnoseResult;
}

export interface ScanCache {
  get(directory: string): CachedScan | undefined;
  set(directory: string, cached: CachedScan): void;
}

export interface AppContext {
  readonly config: AppConfig;
  readonly diagnose: DiagnoseDirectory;
  readonly cache: ScanCache;
}
