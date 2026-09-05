import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateTicketDto, UpdateTicketDto } from "./support.dto";
import { SupportTicket, type SupportTicketDocument } from "./support.schema";

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name)
    private readonly tickets: Model<SupportTicketDocument>,
    private readonly notifications: NotificationsService,
    private readonly config: AppConfigService,
  ) {}

  async create(userId: string, input: CreateTicketDto) {
    const item = await this.tickets.create({
      requesterId: oid(userId),
      subject: input.subject,
      category: input.category,
      preferredContact: input.preferredContact,
      priority: input.priority,
      slaDueAt: new Date(Date.now() + this.slaMinutes(input.priority) * 60_000),
      status: "open",
      messages: [
        { authorId: oid(userId), authorType: "user", body: input.message },
      ],
    });
    return ticketDto(item);
  }

  async listMine(userId: string) {
    const items = await this.tickets
      .find({ requesterId: oid(userId) })
      .sort({ updatedAt: -1 });
    return { items: items.map((item) => ticketDto(item)) };
  }

  async reply(userId: string, ticketId: string, message: string) {
    const item = await this.tickets.findOneAndUpdate(
      {
        _id: oid(ticketId),
        requesterId: oid(userId),
        status: { $nin: ["closed"] },
      },
      {
        $push: {
          messages: {
            authorId: oid(userId),
            authorType: "user",
            body: message,
          },
        },
        $set: { status: "open" },
      },
      { new: true },
    );
    if (!item) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
    return ticketDto(item);
  }

  async listAdmin(status?: string) {
    const items = await this.tickets
      .find(status ? { status } : {})
      .sort({ updatedAt: -1 })
      .limit(500);
    return { items: items.map((item) => ticketDto(item, true)) };
  }

  async update(adminId: string, ticketId: string, input: UpdateTicketDto) {
    const current = await this.tickets.findById(oid(ticketId));
    if (!current)
      throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
    const now = new Date();
    const priority = input.priority ?? current.priority;
    const update: Record<string, unknown> = {
      status: input.status,
      priority,
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId ? oid(input.assigneeId) : null }
        : {}),
      ...(["resolved", "closed"].includes(input.status)
        ? { resolvedAt: now }
        : { resolvedAt: null }),
      ...(input.reply && !current.firstRespondedAt
        ? { firstRespondedAt: now, nextEscalationAt: null }
        : {}),
      ...(input.priority && !current.firstRespondedAt
        ? {
            slaDueAt: new Date(
              current.createdAt.getTime() +
                this.slaMinutes(input.priority) * 60_000,
            ),
          }
        : {}),
    };
    const pushes: Record<string, unknown> = {};
    if (input.reply) {
      pushes.messages = {
        authorId: oid(adminId),
        authorType: "agent",
        body: input.reply,
      };
    }
    if (input.internalNote) {
      pushes.internalNotes = {
        authorId: oid(adminId),
        body: input.internalNote,
        callOutcome: input.callOutcome ?? null,
      };
    }
    const item = await this.tickets.findOneAndUpdate(
      { _id: oid(ticketId) },
      {
        $set: update,
        ...(Object.keys(pushes).length ? { $push: pushes } : {}),
      },
      { new: true },
    );
    if (!item) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
    await this.notifications.notifyTicketUpdated({
      userId: item.requesterId,
      ticketId: item._id,
      status: input.status,
    });
    return ticketDto(item, true);
  }

  private slaMinutes(priority: CreateTicketDto["priority"]) {
    if (priority === "urgent")
      return this.config.env.SUPPORT_SLA_URGENT_MINUTES;
    if (priority === "high") return this.config.env.SUPPORT_SLA_HIGH_MINUTES;
    if (priority === "low")
      return this.config.env.SUPPORT_SLA_NORMAL_MINUTES * 2;
    return this.config.env.SUPPORT_SLA_NORMAL_MINUTES;
  }
}

function ticketDto(item: SupportTicketDocument, includeInternal = false) {
  return {
    id: String(item._id),
    requesterId: String(item.requesterId),
    subject: item.subject,
    category: item.category,
    preferredContact: item.preferredContact,
    priority: item.priority,
    status: item.status,
    assigneeId: item.assigneeId ? String(item.assigneeId) : null,
    messages: item.messages.map((message) => ({
      id: String(message._id),
      authorType: message.authorType,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
    ...(includeInternal
      ? {
          internalNotes: (item.internalNotes ?? []).map((note) => ({
            id: String(note._id),
            authorId: String(note.authorId),
            body: note.body,
            callOutcome: note.callOutcome,
            createdAt: note.createdAt.toISOString(),
          })),
        }
      : {}),
    slaDueAt: item.slaDueAt?.toISOString() ?? null,
    firstRespondedAt: item.firstRespondedAt?.toISOString() ?? null,
    slaBreachedAt: item.slaBreachedAt?.toISOString() ?? null,
    escalationLevel: item.escalationLevel,
    resolvedAt: item.resolvedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  return new Types.ObjectId(value);
}
