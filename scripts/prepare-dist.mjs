import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "out");
const destination = resolve(root, "dist");

if (!source.startsWith(root) || !destination.startsWith(root)) {
  throw new Error("Static output paths must stay inside the project root.");
}

if (!existsSync(source)) {
  throw new Error("Next.js static export was not created at out/.");
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
