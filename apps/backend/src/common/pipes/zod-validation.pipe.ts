import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

import { parse } from "../../lib/validate";

type ZodDto = {
  schema?: ZodType;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== "body") {
      return value;
    }

    const schema = (metadata.metatype as ZodDto | undefined)?.schema;

    if (!schema) {
      return value;
    }

    return parse(schema, aliasRequestFields(value));
  }
}

export function aliasRequestFields(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const body = { ...(input as Record<string, unknown>) };

  if (body.phone === undefined && typeof body.phone_number === "string") {
    body.phone = body.phone_number;
  }

  if (body.code === undefined && typeof body.otp === "string") {
    body.code = body.otp;
  }

  if (
    body.refreshToken === undefined &&
    typeof body.refresh_token === "string"
  ) {
    body.refreshToken = body.refresh_token;
  }

  if (
    body.currentPassword === undefined &&
    typeof body.current_password === "string"
  ) {
    body.currentPassword = body.current_password;
  }

  return body;
}
