import { type INestApplication, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { GlobalExceptionFilter } from "../../common/filters/global-exception.filter";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "./favorites.service";

// Exercise the HTTP contract independently of MongoDB and token signing.
describe("saved items API", () => {
  let app: INestApplication;
  const service = { list: jest.fn(), add: jest.fn(), remove: jest.fn() };
  const userId = "507f1f77bcf86cd799439011";
  const entityId = "507f1f77bcf86cd799439012";

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: {
          switchToHttp: () => {
            getRequest: () => {
              headers: Record<string, string>;
              user?: { sub: string };
            };
          };
        }) {
          const req = context.switchToHttp().getRequest();
          if (req.headers.authorization !== "Bearer test-user")
            throw new UnauthorizedException();
          req.user = { sub: userId };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.listen(0, "127.0.0.1");
  });
  afterAll(() => app.close());
  beforeEach(() => jest.resetAllMocks());

  it("requires authentication for list, save and remove", async () => {
    await request(app.getHttpServer()).get("/api/v1/saves").expect(401);
    await request(app.getHttpServer())
      .put(`/api/v1/saves/club/${entityId}`)
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/api/v1/saves/club/${entityId}`)
      .expect(401);
    expect(service.add).not.toHaveBeenCalled();
  });

  it.each(["article", "club", "coach", "class"])(
    "saves and removes a %s using authenticated identity",
    async (type) => {
      service.add.mockResolvedValue({ entityType: type, entityId });
      service.remove.mockResolvedValue({ success: true });
      await request(app.getHttpServer())
        .put(`/api/v1/saves/${type}/${entityId}`)
        .set("Authorization", "Bearer test-user")
        .send({ userId: "another-user" })
        .expect(200, { entityType: type, entityId });
      expect(service.add).toHaveBeenCalledWith(userId, type, entityId);
      await request(app.getHttpServer())
        .delete(`/api/v1/saves/${type}/${entityId}`)
        .set("Authorization", "Bearer test-user")
        .expect(200, { success: true });
      expect(service.remove).toHaveBeenCalledWith(userId, type, entityId);
    },
  );

  it("lists the same saved records through the new and legacy routes", async () => {
    service.list.mockResolvedValue({ items: [] });
    for (const route of ["saves", "favorites"]) {
      await request(app.getHttpServer())
        .get(`/api/v1/${route}`)
        .set("Authorization", "Bearer test-user")
        .expect(200, { items: [] });
    }
    expect(service.list).toHaveBeenNthCalledWith(1, userId);
    expect(service.list).toHaveBeenNthCalledWith(2, userId);
  });

  it("rejects unsupported save types", async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/saves/unknown/${entityId}`)
      .set("Authorization", "Bearer test-user")
      .expect(400);
    expect(service.add).not.toHaveBeenCalled();
  });
});
