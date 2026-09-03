import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { Observable, map } from "rxjs";

import { CURRENT_API_VERSION } from "../../lib/http";

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.originalUrl ?? request.url;

    if (!path.startsWith("/api")) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload) => {
        if (isAlreadyWrapped(payload)) {
          return payload;
        }

        return {
          data: payload,
          meta: { version: CURRENT_API_VERSION },
        };
      }),
    );
  }
}

function isAlreadyWrapped(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return "data" in payload && "meta" in payload;
}
