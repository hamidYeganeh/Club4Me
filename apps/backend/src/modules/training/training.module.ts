import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { TrainingController } from "./training.controller";
import { TrainingService } from "./training.service";
import {
  WorkoutAssignmentSchema,
  WorkoutPlanSchema,
  WorkoutSessionSchema,
} from "./training.models";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "WorkoutPlan", schema: WorkoutPlanSchema },
      { name: "WorkoutAssignment", schema: WorkoutAssignmentSchema },
      { name: "WorkoutSession", schema: WorkoutSessionSchema },
    ]),
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
