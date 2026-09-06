import ts from "typescript";

/** Reuse Next page wrappers with locally resolved route params. Unexpected server work fails the native build. */
export function adaptNativePage(source: string, filename: string): string {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const result = ts.transform(file, [
    (context) => {
      const visit: ts.Visitor = (node) => {
        if (
          ts.isFunctionDeclaration(node) &&
          node.name?.text === "generateStaticParams"
        )
          return undefined;
        if (
          ts.isVariableStatement(node) &&
          node.declarationList.declarations.some(
            (item) =>
              ts.isIdentifier(item.name) &&
              ["metadata", "dynamicParams", "dynamic", "revalidate"].includes(
                item.name.text,
              ),
          )
        )
          return undefined;
        if (
          ts.isFunctionDeclaration(node) &&
          node.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
          )
        ) {
          const visitBody: ts.Visitor = (child) => {
            if (ts.isAwaitExpression(child)) {
              if (
                ts.isIdentifier(child.expression) &&
                ["params", "searchParams"].includes(child.expression.text)
              )
                return child.expression;
              throw new Error(
                `Native page ${filename} contains server-only async work; move it to a shared client screen.`,
              );
            }
            return ts.visitEachChild(child, visitBody, context);
          };
          return ts.factory.updateFunctionDeclaration(
            node,
            node.modifiers?.filter(
              (modifier) => modifier.kind !== ts.SyntaxKind.AsyncKeyword,
            ),
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            node.body
              ? (ts.visitNode(node.body, visitBody) as ts.Block)
              : undefined,
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (root) => ts.visitNode(root, visit) as ts.SourceFile;
    },
  ]);
  const output = ts.createPrinter().printFile(result.transformed[0]!);
  result.dispose();
  return output;
}
