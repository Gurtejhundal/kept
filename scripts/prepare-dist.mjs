import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const serverEntry = resolve(root, "dist", "server", "index.js");
const hostingSource = resolve(root, ".openai", "hosting.json");
const hostingDirectory = resolve(root, "dist", ".openai");
const hostingDestination = resolve(hostingDirectory, "hosting.json");

if (!serverEntry.startsWith(root) || !hostingDestination.startsWith(root)) {
  throw new Error("Deployment output paths must stay inside the project root.");
}

if (!existsSync(serverEntry)) {
  throw new Error("vinext did not create the required dist/server/index.js entrypoint.");
}

if (!existsSync(hostingSource)) {
  throw new Error("Sites configuration is missing at .openai/hosting.json.");
}

mkdirSync(hostingDirectory, { recursive: true });
copyFileSync(hostingSource, hostingDestination);
