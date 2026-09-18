import { diagnose } from "react-doctor/api";
import { defaultAppConfig } from "./config.js";
import type { AppContext } from "./tools/contracts.js";
import { createScanCache } from "./utils/scan-cache.js";

export const wire = (): AppContext => ({
  config: defaultAppConfig,
  diagnose: (directory, options) => diagnose(directory, options),
  cache: createScanCache(),
});
