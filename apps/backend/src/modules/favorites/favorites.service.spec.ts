import { Types } from "mongoose";
import { FavoritesService } from "./favorites.service";

const userId = new Types.ObjectId().toHexString();
const articleId = new Types.ObjectId().toHexString();

describe("FavoritesService article saves", () => {
  const favorites = {
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
  };
  const articles = { exists: jest.fn() };
  const service = new FavoritesService(
    favorites as never,
    articles as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => jest.resetAllMocks());

  it("saves a published article for the authenticated user", async () => {
    articles.exists.mockResolvedValue({ _id: articleId });
    favorites.findOneAndUpdate.mockResolvedValue({
      _id: new Types.ObjectId(),
      entityType: "article",
      entityId: articleId,
      createdAt: new Date(),
    });
    expect(await service.add(userId, "article", articleId)).toMatchObject({
      entityType: "article",
      entityId: articleId,
    });
    expect(articles.exists).toHaveBeenCalledWith({
      _id: new Types.ObjectId(articleId),
      status: "published",
    });
    expect(favorites.findOneAndUpdate).toHaveBeenCalledWith(
      {
        userId: new Types.ObjectId(userId),
        entityType: "article",
        entityId: new Types.ObjectId(articleId),
      },
      expect.anything(),
      expect.objectContaining({ upsert: true }),
    );
  });

  it("rejects missing or unpublished articles without saving", async () => {
    articles.exists.mockResolvedValue(null);
    await expect(service.add(userId, "article", articleId)).rejects.toThrow(
      "Favorite target not found",
    );
    expect(favorites.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("can remove a saved article after it is unpublished, scoped to its user", async () => {
    await expect(service.remove(userId, "article", articleId)).resolves.toEqual(
      { success: true },
    );
    expect(articles.exists).not.toHaveBeenCalled();
    expect(favorites.deleteOne).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
      entityType: "article",
      entityId: new Types.ObjectId(articleId),
    });
  });
});
