import { Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { toPublicUser, type PublicUser } from "./mappers/user.mapper";
import { UsersRepository } from "./users.repository";
import type { UserActivityLevel, UserGender } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findById(id: string): Promise<PublicUser> {
    return this.usersRepository.findById(id);
  }

  findOrCreateByPhone(phone: string): Promise<PublicUser> {
    return this.usersRepository.findOrCreateByPhone(phone);
  }

  list(query?: string) {
    return this.usersRepository.list(query);
  }

  updateStatus(userId: string, status: "active" | "suspended") {
    return this.usersRepository.updateStatus(userId, status);
  }

  updateProfile(
    userId: string,
    profile: {
      firstName?: string;
      lastName?: string;
      birthdate?: string;
      gender?: UserGender;
      genderDescription?: string;
      activityLevel?: UserActivityLevel;
      idCard?: string;
      avatarUrl?: string;
    },
  ): Promise<PublicUser> {
    return this.usersRepository.updateProfile(userId, profile);
  }

  deleteAccount(userId: string) {
    return this.usersRepository.deleteAccount(userId);
  }

  findDocumentByPhone(phone: string) {
    return this.usersRepository.findDocumentByPhone(phone);
  }

  async requireByPhone(phone: string): Promise<PublicUser> {
    const user = await this.usersRepository.findDocumentByPhone(phone);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return toPublicUser(user);
  }

  setPassword(
    userId: string,
    password: string,
    currentPassword?: string,
  ): Promise<PublicUser> {
    return this.usersRepository.setPassword(userId, password, currentPassword);
  }

  resetPassword(phone: string, password: string): Promise<PublicUser> {
    return this.usersRepository.resetPassword(phone, password);
  }

  authenticate(phone: string, password: string): Promise<PublicUser> {
    return this.usersRepository.authenticate(phone, password);
  }
}
