import mongoose, { type Connection, type Model } from "mongoose";
import { MongoMemoryServer } from "../../../test/mongo-memory";
import { ArticlesRepository } from "./articles.repository";
import {
  Article,
  ArticleSchema,
  type ArticleDocument,
} from "./schemas/article.schema";

describe("article draft persistence", () => {
  jest.setTimeout(60000);
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let repository: ArticlesRepository;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongo.getUri()).asPromise();
    const model = connection.model(Article.name, ArticleSchema);
    await model.syncIndexes();
    repository = new ArticlesRepository(
      model as unknown as Model<ArticleDocument>,
    );
  });
  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });
  it("saves an empty draft, accepts later content, and reports duplicate slugs as conflicts", async () => {
    const input = {
      title: "پیش‌نویس",
      slug: "draft-regression",
      authorName: "نویسنده",
      categoryId: String(new mongoose.Types.ObjectId()),
    };
    const draft = await repository.create(input, "دسته");
    expect(draft.bodyHtml).toBe("");
    await repository.update(
      draft.id,
      { bodyHtml: "<p>متن تکمیل‌شده</p>" },
      "دسته",
    );
    expect((await repository.findById(draft.id, "دسته"))?.bodyHtml).toBe(
      "<p>متن تکمیل‌شده</p>",
    );
    await expect(repository.create(input, "دسته")).rejects.toMatchObject({
      status: 409,
      code: "ARTICLE_SLUG_TAKEN",
    });
    await repository.update(draft.id, { bodyHtml: "" }, "دسته");
    expect((await repository.findById(draft.id, "دسته"))?.bodyHtml).toBe("");
  });
});
