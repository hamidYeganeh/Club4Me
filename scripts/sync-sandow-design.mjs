import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = JSON.parse(
  await readFile(new URL("docs/design/sandow-extraction.json", root), "utf8"),
);
const names = new Set();
const declarations = source.colors.map(({ name, value }) => {
  const property = `--sandow-${name.toLowerCase().replace(/[\s/]+/g, "-")}`;
  if (names.has(property) || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Invalid or duplicate palette token: ${name}`);
  }
  names.add(property);
  return `  ${property}: ${value};`;
});
const output = `/* Generated from docs/design/sandow-extraction.json. Run npm run design:sync. */\n:root {\n${declarations.join("\n")}\n}\n`;
const target = new URL("packages/theme/src/sandow-palette.css", root);
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8")).trimEnd() !== output.trimEnd()) {
    throw new Error("Sandow palette is out of sync. Run npm run design:sync.");
  }
  console.log(`Verified ${names.size} Sandow palette tokens.`);
} else {
  await writeFile(target, output);
  console.log(`Synced ${names.size} Sandow palette tokens.`);
}
