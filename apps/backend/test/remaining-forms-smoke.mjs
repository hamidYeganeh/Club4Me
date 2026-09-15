import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
// This runner writes exclusively to fullstack-server's isolated acceptance database.
const origin = "http://127.0.0.1:7088";
const fixtureResponse = await fetch(`${origin}/__acceptance/fixture`);
assert.equal(fixtureResponse.status, 200);
const fixture = await fixtureResponse.json();
assert.equal(fixture.club.slug, "fullstack-club");
const tokens = {};
async function request(role, method, path, payload, expected = 200) {
  const response = await fetch(`${origin}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(result.error ?? {})}`,
  );
  return result.data ?? result;
}
for (const role of ["admin", "athlete", "coach", "owner"]) {
  const login = await request(null, "POST", "/account/auth/login", {
    phone: {
      admin: "09121230005",
      athlete: "09121230002",
      coach: "09121230004",
      owner: "09121230001",
    }[role],
    password: "Acceptance@1405",
  });
  assert.ok(login.accessToken);
  tokens[role] = login.accessToken;
}
for (const role of ["athlete", "coach", "owner"]) {
  await request(
    role,
    "POST",
    "/admin/articles",
    {
      title: "Forbidden",
      authorName: "Forbidden",
      categoryId: "000000000000000000000001",
    },
    403,
  );
  await request(
    role,
    "POST",
    "/resources/sports/sport",
    { name: "Forbidden", code: "FORBIDDEN" },
    403,
  );
}
const code = `acceptance-${randomUUID()}`;
const resource = await request(
  "admin",
  "POST",
  "/resources/sports/sport",
  { name: "منبع آزمایش سرویس", code, sortOrder: 0 },
  201,
);
await request("admin", "PATCH", `/resources/sports/sport/${resource.id}`, {
  name: "منبع ویرایش‌شده",
});
assert.equal(
  (await request("admin", "GET", `/resources/sports/sport/${resource.id}`))
    .name,
  "منبع ویرایش‌شده",
);
await request(
  "admin",
  "POST",
  "/resources/sports/sport",
  { name: "تکراری", code },
  409,
);
await request("admin", "POST", "/resources/sports/sport", { name: "" }, 400);
const category = await request(
  "admin",
  "POST",
  "/admin/article-categories",
  { name: `دسته ${code}` },
  201,
);
const article = await request(
  "admin",
  "POST",
  "/admin/articles",
  {
    title: "مقاله آزمایش سرویس",
    authorName: "پذیرش",
    categoryId: category.id,
    slug: code,
    bodyHtml: "<p>متن اولیه</p>",
    status: "draft",
  },
  201,
);
await request("admin", "PATCH", `/admin/articles/${article.id}`, {
  title: "مقاله ویرایش‌شده",
  bodyHtml: "<p>متن جدید</p>",
});
const saved = await request("admin", "GET", `/admin/articles/${article.id}`);
assert.equal(saved.title, "مقاله ویرایش‌شده");
assert.equal(saved.bodyHtml, "<p>متن جدید</p>");
await request(
  "admin",
  "POST",
  "/admin/articles",
  { title: "تکراری", authorName: "پذیرش", categoryId: category.id, slug: code },
  409,
);
await request("admin", "POST", "/admin/articles", { title: "" }, 400);
await request("admin", "DELETE", `/admin/articles/${article.id}`);
await request("admin", "DELETE", `/resources/sports/sport/${resource.id}`);
console.log(
  "PASS: resource/article create, edit, persistence, duplicate conflicts, invalid forms, and six non-admin write denials.",
);
