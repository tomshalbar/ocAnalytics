import { readFileSync, writeFileSync } from "node:fs";

const source = new URL("../src/data/reference/id_to_name.csv", import.meta.url);
const output = new URL(
  "../src/data/reference/location-names.generated.ts",
  import.meta.url,
);

// Read CSV fields, including quoted commas, escaped quotes, and CRLF endings.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      row.push(field.trim());
      field = "";
      if (char !== ",") {
        rows.push(row);
        row = [];
        if (char === "\r" && text[index + 1] === "\n") index++;
      }
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("Unclosed quoted field in location CSV.");
  if (field || row.length) rows.push([...row, field.trim()]);
  return rows;
}

const rows = parseCsv(readFileSync(source, "utf8").replace(/^\uFEFF/, ""));
if (rows.length !== 2 || rows[0].length !== rows[1].length) {
  throw new Error(
    "Location CSV must contain two equally sized rows: IDs, then names.",
  );
}
const names = new Map();
rows[0].forEach((id, index) => {
  const name = rows[1][index];
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || !name) {
    throw new Error(`Invalid location ID or name in column ${index + 1}.`);
  }
  const locationId = Number(id);
  if (names.has(locationId)) throw new Error(`Duplicate location ID: ${id}.`);
  names.set(locationId, name);
});

const generated = [
  "// Generated from id_to_name.csv. Run npm run generate:location-names to update.",
  "export const locationNames: Readonly<Partial<Record<number, string>>> = {",
  ...Array.from(names, ([id, name]) => `  ${id}: ${JSON.stringify(name)},`),
  "};",
  "",
].join("\n");

if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8").replace(/\r\n/g, "\n") !== generated) {
    throw new Error(
      "Location names are out of date. Run npm run generate:location-names.",
    );
  }
} else {
  writeFileSync(output, generated);
}
