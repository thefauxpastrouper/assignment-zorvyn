import type { Response } from "express";
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
} from "@prisma/client-runtime-utils";
import { AppError } from "./error";
import { errorResponse } from "./response";

const isProduction = () => process.env.NODE_ENV === "production";

const INTERNAL_GENERIC = "Something went wrong. Please try again later.";
const SERVICE_UNAVAILABLE =
  "The service is temporarily unavailable. Please try again later.";

function isLikelyInternalLeak(message: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  if (message.includes("\n")) return true;
  if (m.includes("prisma")) return true;
  if (m.includes("invocation")) return true;
  if (m.includes("invalid `prisma")) return true;
  if (m.includes("postgres") || m.includes("postgresql")) return true;
  if (m.includes("datasource") && m.includes("error")) return true;
  if (m.includes("engine")) return true;
  return false;
}

function mapPrismaKnownError(
  e: PrismaClientKnownRequestError
): { message: string; statusCode: number } {
  const code = e.code;
  switch (code) {
    case "P2002":
      return {
        message: "A record with this value already exists.",
        statusCode: 409,
      };
    case "P2025":
      return { message: "Resource not found.", statusCode: 404 };
    case "P2003":
      return {
        message: isProduction()
          ? "This operation could not be completed."
          : e.message,
        statusCode: 400,
      };
    case "P2021":
    case "P2010":
    case "P1001":
    case "P1000":
      return {
        message: isProduction() ? SERVICE_UNAVAILABLE : e.message,
        statusCode: 503,
      };
    default:
      return {
        message: isProduction() ? INTERNAL_GENERIC : e.message,
        statusCode: isProduction() ? 500 : 400,
      };
  }
}

export function resolveClientError(
  error: unknown,
  options?: { defaultStatus?: number }
): { message: string; statusCode: number; logDetail: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      logDetail: error.message,
    };
  }

  if (error instanceof PrismaClientKnownRequestError) {
    const mapped = mapPrismaKnownError(error);
    return {
      message: mapped.message,
      statusCode: mapped.statusCode,
      logDetail: `${error.code}: ${error.message}`,
    };
  }

  if (error instanceof PrismaClientValidationError) {
    return {
      message: isProduction() ? "Invalid request data." : error.message,
      statusCode: 400,
      logDetail: error.message,
    };
  }

  if (
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientInitializationError ||
    error instanceof PrismaClientRustPanicError
  ) {
    return {
      message: isProduction() ? INTERNAL_GENERIC : error.message,
      statusCode: 503,
      logDetail: error.message,
    };
  }

  if (error instanceof Error) {
    if (isProduction() && isLikelyInternalLeak(error.message)) {
      return {
        message: INTERNAL_GENERIC,
        statusCode: 500,
        logDetail: error.message,
      };
    }
    const statusCode = options?.defaultStatus ?? 400;
    return {
      message: error.message,
      statusCode,
      logDetail: error.message,
    };
  }

  return {
    message: isProduction() ? INTERNAL_GENERIC : "Unknown error",
    statusCode: 500,
    logDetail: String(error),
  };
}

export function clientErrorKey(error: unknown, statusCode: number): string {
  if (statusCode >= 500) return "ServerError";
  if (!isProduction() && error instanceof Error && error.name !== "Error") {
    return error.name;
  }
  return "RequestError";
}

export function respondWithError(
  res: Response,
  error: unknown,
  options?: { defaultStatus?: number; context?: string }
): void {
  const resolved = resolveClientError(error, options);
  const tag = options?.context ? `[${options.context}]` : "[API]";
  console.error(`${tag} ${resolved.logDetail}`);
  if (!isProduction() && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  errorResponse(res, resolved.message, resolved.statusCode);
}
