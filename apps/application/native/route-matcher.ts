export function routePath(file: string) {
  return (
    file.replace(/^.*\/app/, "").replace(/\/(?:page|layout)\.tsx$/, "") || "/"
  );
}
export function matchRoute(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const expected = pattern.split("/").filter(Boolean);
  const actual = pathname.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index++) {
    const part = expected[index]!;
    if (part.startsWith("[") && part.endsWith("]")) {
      try {
        params[part.slice(1, -1)] = decodeURIComponent(actual[index]!);
      } catch {
        return null;
      }
    } else if (part !== actual[index]) return null;
  }
  return params;
}
export function routeSpecificity(pattern: string) {
  return pattern
    .split("/")
    .reduce((score, part) => score + (part.startsWith("[") ? 1 : 10), 0);
}
