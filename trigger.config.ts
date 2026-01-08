// import { defineConfig } from "@trigger.dev/sdk";

// Temporary fix for TypeScript - defineConfig may not be exported in this version
export default {
  project: "proj_pdxruug",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
} as const;
