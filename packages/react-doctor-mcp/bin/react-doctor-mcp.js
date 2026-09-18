#!/usr/bin/env node

import module from "node:module";

if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  module.enableCompileCache();
}

const { run, wire } = await import("../dist/index.js");
await run(wire());
