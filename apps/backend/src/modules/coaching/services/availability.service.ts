import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type {
  CreateAvailabilityExceptionDto,
  ReplaceAvailabilityDto,
} from "../dto/coaching.dto";
import {
  CoachAvailabilityException,
  type CoachAvailabilityExceptionDocument,
  CoachAvailabilityRule,
  type CoachAvailabilityRuleDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(CoachAvailabilityRule.name)
    private readonly rules: Model<CoachAvailabilityRuleDocument>,
    @InjectModel(CoachAvailabilityException.name)
    private readonly exceptions: Model<CoachAvailabilityExceptionDocument>,
    private readonly coaches: CoachesService,
  ) {}

  async get(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const [rules, exceptions] = await Promise.all([
      this.rules
        .find({ coachId: coach._id })
        .sort({ dayOfWeek: 1, startMinute: 1 })
        .exec(),
      this.exceptions
        .find({ coachId: coach._id, date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(365)
        .exec(),
    ]);
    return {
      rules: rules.map(toPublicDocument),
      exceptions: exceptions.map(toPublicDocument),
    };
  }

  async replace(userId: string, input: ReplaceAvailabilityDto["rules"]) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    assertNoRuleOverlap(input);
    if (input.length) {
      const created = await this.rules.insertMany(
        input.map((rule) => ({
          coachId: coach._id,
          ...rule,
          clubId: rule.clubId ? objectId(rule.clubId) : undefined,
        })),
      );
      await this.rules
        .deleteMany({
          coachId: coach._id,
          _id: { $nin: created.map((rule) => rule._id) },
        })
        .exec();
    } else {
      await this.rules.deleteMany({ coachId: coach._id }).exec();
    }
    return this.get(userId);
  }

  async addException(userId: string, input: CreateAvailabilityExceptionDto) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const created = await this.exceptions.create({
      coachId: coach._id,
      ...input,
    });
    return toPublicDocument(created);
  }
}

function assertNoRuleOverlap(rules: ReplaceAvailabilityDto["rules"]) {
  for (let left = 0; left < rules.length; left += 1) {
    for (let right = left + 1; right < rules.length; right += 1) {
      const first = rules[left]!;
      const second = rules[right]!;
      if (
        first.dayOfWeek === second.dayOfWeek &&
        first.startMinute < second.endMinute &&
        second.startMinute < first.endMinute
      ) {
        throw new AppError(
          400,
          "AVAILABILITY_RULES_OVERLAP",
          "Availability rules cannot overlap",
          {
            indexes: [left, right],
          },
        );
      }
    }
  }
}
