import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  createConfiguredRuntimeEnv,
  resolveConfiguredDaemonPort,
  resolveConfiguredWebPort,
  resolveToolDevConfig,
} from "../src/config.js";

async function withTempConfig<T>(content: unknown, run: (path: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "open-design-tools-dev-config-"));
  const path = join(dir, "tools-dev.config.json");
  try {
    await writeFile(path, `${JSON.stringify(content, null, 2)}\n`, "utf8");
    return await run(path);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

describe("tools-dev config file", () => {
  it("loads host, port, and allowed-origin defaults from a config file", async () => {
    await withTempConfig(
      {
        host: "0.0.0.0",
        bindHost: "0.0.0.0",
        daemonPort: 3001,
        webPort: 3000,
        allowedOrigins: ["http://13.209.4.19:3000"],
        allowedDevOrigins: ["13.209.4.19"],
      },
      async (configFile) => {
        const config = resolveToolDevConfig({ configFile });

        assert.equal(config.devServer.configFilePath, configFile);
        assert.equal(resolveConfiguredDaemonPort(config, {}), 3001);
        assert.equal(resolveConfiguredWebPort(config, {}), 3000);
        assert.deepEqual(createConfiguredRuntimeEnv(config, {}), {
          OD_ALLOWED_DEV_ORIGINS: "13.209.4.19",
          OD_ALLOWED_ORIGINS: "http://13.209.4.19:3000",
          OD_BIND_HOST: "0.0.0.0",
          OD_HOST: "0.0.0.0",
        });
      },
    );
  });

  it("lets CLI ports override config-file ports", async () => {
    await withTempConfig(
      {
        daemonPort: 3001,
        webPort: 3000,
      },
      async (configFile) => {
        const config = resolveToolDevConfig({ configFile });

        assert.equal(resolveConfiguredDaemonPort(config, { daemonPort: 3101 }), 3101);
        assert.equal(resolveConfiguredWebPort(config, { webPort: 3100 }), 3100);
      },
    );
  });

  it("does not replace explicit runtime environment overrides with config defaults", async () => {
    await withTempConfig(
      {
        host: "0.0.0.0",
        bindHost: "0.0.0.0",
        allowedOrigins: ["http://13.209.4.19:3000"],
        allowedDevOrigins: ["13.209.4.19"],
      },
      async (configFile) => {
        const config = resolveToolDevConfig({ configFile });

        assert.deepEqual(createConfiguredRuntimeEnv(config, {
          OD_ALLOWED_DEV_ORIGINS: "localhost",
          OD_ALLOWED_ORIGINS: "http://localhost:3000",
          OD_BIND_HOST: "127.0.0.1",
          OD_HOST: "127.0.0.1",
        }), {});
      },
    );
  });
});
