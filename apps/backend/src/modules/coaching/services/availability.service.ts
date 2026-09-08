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
  CoachAvailabilityPlan,
  type CoachAvailabilityPlanDocument,
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
    @InjectModel(CoachAvailabilityPlan.name)
    private readonly plans: Model<CoachAvailabilityPlanDocument>,
  ) {}

  async get(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const [rules, exceptions] = await Promise.all([
      this.readRules(coach._id),
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

  private async readRules(coachId: CoachAvailabilityRule["coachId"]) {
    const plan = await this.plans.findById(coachId).exec();
    if (plan)
      return [...plan.rules].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute,
      );
    return this.rules
      .find({ coachId })
      .sort({ dayOfWeek: 1, startMinute: 1 })
      .exec();
  }

  async replace(userId: string, input: ReplaceAvailabilityDto["rules"]) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    assertNoRuleOverlap(input);
    const rules = input.map((rule) => ({
      ...rule,
      coachId: coach._id,
      clubId: rule.clubId ? objectId(rule.clubId) : undefined,
    }));
    await this.plans
      .findOneAndUpdate(
        { _id: coach._id },
        { $set: { rules } },
        { upsert: true, new: true, runValidators: true },
      )
      .exec();
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
        first.validFrom <= (second.validUntil ?? new Date(8640000000000000)) &&
        second.validFrom <= (first.validUntil ?? new Date(8640000000000000)) &&
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
