import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateTicketDto, UpdateTicketDto } from "./support.dto";
import { SupportTicket, type SupportTicketDocument } from "./support.schema";

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name)
    private readonly tickets: Model<SupportTicketDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, input: CreateTicketDto) {
    const item = await this.tickets.create({
      requesterId: oid(userId),
      subject: input.subject,
      category: input.category,
      preferredContact: input.preferredContact,
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
    return { items: items.map(ticketDto) };
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
    return { items: items.map(ticketDto) };
  }

  async update(adminId: string, ticketId: string, input: UpdateTicketDto) {
    const update: Record<string, unknown> = {
      status: input.status,
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId ? oid(input.assigneeId) : null }
        : {}),
      ...(["resolved", "closed"].includes(input.status)
        ? { resolvedAt: new Date() }
        : { resolvedAt: null }),
    };
    const item = await this.tickets.findOneAndUpdate(
      { _id: oid(ticketId) },
      {
        $set: update,
        ...(input.reply
          ? {
              $push: {
                messages: {
                  authorId: oid(adminId),
                  authorType: "agent",
                  body: input.reply,
                },
              },
            }
          : {}),
      },
      { new: true },
    );
    if (!item) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
    await this.notifications.notifyTicketUpdated({
      userId: item.requesterId,
      ticketId: item._id,
      status: input.status,
    });
    return ticketDto(item);
  }
}

function ticketDto(item: SupportTicketDocument) {
  return {
    id: String(item._id),
    subject: item.subject,
    category: item.category,
    preferredContact: item.preferredContact,
    status: item.status,
    assigneeId: item.assigneeId ? String(item.assigneeId) : null,
    messages: item.messages.map((message) => ({
      id: String(message._id),
      authorType: message.authorType,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
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
