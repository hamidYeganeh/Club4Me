const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = process.cwd();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.name === "node_modules" || e.name === ".next" || e.name === "dist" || e.name === "out") return [];
  return e.isDirectory() ? walk(p) : [p];
});
const apiFiles = walk(path.join(root, "packages/api/src")).filter((f) => /\.tsx?$/.test(f));
const uiFiles = ["admin", "application", "business", "website"].flatMap((app) =>
  walk(path.join(root, "apps", app)).filter((f) => /\.tsx?$/.test(f)),
).concat(walk(path.join(root, "packages/ui/src")).filter((f) => /\.tsx?$/.test(f)));
const uiText = uiFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

const exportedHooks = [];
const modelFields = [];
for (const file of apiFiles) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const isExported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const node of sf.statements) {
    if (ts.isFunctionDeclaration(node) && isExported(node) && node.name?.text.startsWith("use")) {
      exportedHooks.push({ name: node.name.text, file, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
    }
    if ((ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && isExported(node)) {
      const name = node.name.text;
      if (/Payload|Variables|Params|Config|Traits|Event$|Response$|Status$|Platform$|Mode$|Kind$/.test(name)) continue;
      const members = ts.isInterfaceDeclaration(node) ? node.members : ts.isTypeLiteralNode(node.type) ? node.type.members : [];
      for (const member of members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const field = ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : null;
        if (field) modelFields.push({ model: name, field, file, line: sf.getLineAndCharacterOfPosition(member.getStart()).line + 1 });
      }
    }
  }
}

const unusedHooks = exportedHooks.filter(({ name }) => !new RegExp(`\\b${name}\\b`).test(uiText));
const unusedFields = modelFields.filter(({ field }) => !new RegExp(`\\b${field}\\b`).test(uiText));

const rel = (f) => path.relative(root, f);
console.log(JSON.stringify({
  stats: { uiFiles: uiFiles.length, hooks: exportedHooks.length, fields: modelFields.length },
  unusedHooks: unusedHooks.map((x) => ({ ...x, file: rel(x.file) })),
  unusedFields: unusedFields.map((x) => ({ ...x, file: rel(x.file) })),
}, null, 2));
