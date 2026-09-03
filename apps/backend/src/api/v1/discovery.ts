import { Hono } from "hono";
import { z } from "zod";

import { AppError } from "../../lib/errors.js";
import { ok } from "../../lib/http.js";
import { parse } from "../../lib/validate.js";
import { getAuthUser, requireAuth } from "../../middleware/auth.js";
import {
  createClass,
  createClub,
  createSlot,
  getClub,
  listClasses,
  listClubs,
  listSlots,
  reserveSlot,
} from "../../services/discovery.js";
import type { AppEnv } from "../../types.js";

const listClubsQuery = z.object({
  city: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createClubBody = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(2000).optional(),
});

const createClassBody = z.object({
  name: z.string().trim().min(2).max(120),
  sport: z.string().trim().min(2).max(80).optional(),
});

const createSlotBody = z.object({
  classId: z.string().min(1).optional(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.number().int().min(1).max(500),
});

const reserveSlotBody = z.object({
  slotId: z.string().min(1),
  participantCount: z.number().int().min(1).max(20).default(1),
});

export function createDiscoveryRouter() {
  const discovery = new Hono<AppEnv>();
  const clubs = new Hono<AppEnv>();

  clubs.get("/", async (c) => {
    const query = parse(listClubsQuery, c.req.query());
    const result = await listClubs(query);

    return ok(c, result);
  });

  clubs.post("/", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    if (!authUser.roles.includes("owner")) {
      throw new AppError(403, "FORBIDDEN", "Owner access required");
    }
    const body = parse(createClubBody, await c.req.json());
    const club = await createClub({
      ...body,
      ownerId: authUser.sub,
    });

    return ok(c, club, 201);
  });

  clubs.get("/:clubId", async (c) => {
    const club = await getClub(c.req.param("clubId"));

    return ok(c, club);
  });

  clubs.get("/:clubId/classes", async (c) => {
    const items = await listClasses(c.req.param("clubId"));

    return ok(c, { items });
  });

  clubs.post("/:clubId/classes", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    if (!authUser.roles.includes("owner")) {
      throw new AppError(403, "FORBIDDEN", "Owner access required");
    }
    const body = parse(createClassBody, await c.req.json());
    const item = await createClass({
      clubId: c.req.param("clubId"),
      ownerId: authUser.sub,
      ...body,
    });

    return ok(c, item, 201);
  });

  clubs.get("/:clubId/slots", async (c) => {
    const items = await listSlots(c.req.param("clubId"));

    return ok(c, { items });
  });

  clubs.post("/:clubId/slots", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    if (!authUser.roles.includes("owner")) {
      throw new AppError(403, "FORBIDDEN", "Owner access required");
    }
    const body = parse(createSlotBody, await c.req.json());
    const slot = await createSlot({
      clubId: c.req.param("clubId"),
      ownerId: authUser.sub,
      ...body,
    });

    return ok(c, slot, 201);
  });

  clubs.post("/:clubId/slots/reserve", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    const body = parse(reserveSlotBody, await c.req.json());
    const reservation = await reserveSlot({
      clubId: c.req.param("clubId"),
      slotId: body.slotId,
      userId: authUser.sub,
      participantCount: body.participantCount,
    });

    return ok(c, reservation, 201);
  });

  discovery.route("/clubs", clubs);

  return discovery;
}
