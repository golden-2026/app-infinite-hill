import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = Number(process.env.GOLDEN_TEST_PORT || 4178);
const baseUrl = `http://${host}:${port}`;

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", host, "--port", String(port), "--strictPort"], {
  cwd: process.cwd(),
  env: { ...process.env, BROWSER: "none" },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitUntilReady() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Golden test server exited early.\n${serverOutput}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Golden test server did not become ready.\n${serverOutput}`);
}

function stopServer() {
  if (server.exitCode === null) server.kill("SIGTERM");
}

process.on("SIGINT", () => { stopServer(); process.exit(130); });
process.on("SIGTERM", () => { stopServer(); process.exit(143); });

try {
  await waitUntilReady();
  const tests = spawn(process.execPath, ["--test", "tests/e2e/*.test.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: "inherit",
    shell: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    tests.once("error", reject);
    tests.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  process.exitCode = exitCode;
} finally {
  stopServer();
}
