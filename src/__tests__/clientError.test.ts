import { afterEach, describe, expect, it } from "vitest";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { resolveClientError, clientErrorKey } from "../utils/clientError";
import { AppError } from "../utils/error";

describe("resolveClientError", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("passes through AppError", () => {
    const err = new AppError("Not allowed", 403);
    const r = resolveClientError(err);
    expect(r.message).toBe("Not allowed");
    expect(r.statusCode).toBe(403);
  });

  it("passes through safe Error message in development", () => {
    process.env.NODE_ENV = "development";
    const r = resolveClientError(new Error("Invalid email or password"));
    expect(r.message).toBe("Invalid email or password");
    expect(r.statusCode).toBe(400);
  });

  it("sanitizes leaky Error message in production", () => {
    process.env.NODE_ENV = "production";
    const r = resolveClientError(
      new Error(
        'Invalid `prisma.user.findUnique()` invocation:\nThe table `public.User` does not exist.'
      )
    );
    expect(r.message).toBe("Something went wrong. Please try again later.");
    expect(r.statusCode).toBe(500);
  });

  it("maps PrismaClientKnownRequestError P2021 in production", () => {
    process.env.NODE_ENV = "production";
    const err = new PrismaClientKnownRequestError("internal", {
      code: "P2021",
      clientVersion: "test",
    });
    const r = resolveClientError(err);
    expect(r.message).toBe(
      "The service is temporarily unavailable. Please try again later."
    );
    expect(r.statusCode).toBe(503);
  });

  it("exposes Prisma known error detail in development", () => {
    process.env.NODE_ENV = "development";
    const err = new PrismaClientKnownRequestError("table missing", {
      code: "P2021",
      clientVersion: "test",
    });
    const r = resolveClientError(err);
    expect(r.message).toBe("table missing");
    expect(r.statusCode).toBe(503);
  });

  it("uses defaultStatus for plain Error", () => {
    process.env.NODE_ENV = "development";
    const r = resolveClientError(new Error("Record not found"), {
      defaultStatus: 404,
    });
    expect(r.statusCode).toBe(404);
  });
});

describe("clientErrorKey", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("returns ServerError for 5xx", () => {
    expect(clientErrorKey(new Error("x"), 503)).toBe("ServerError");
  });

  it("hides Prisma class name in production", () => {
    process.env.NODE_ENV = "production";
    const err = new PrismaClientKnownRequestError("x", {
      code: "P2002",
      clientVersion: "1",
    });
    expect(clientErrorKey(err, 409)).toBe("RequestError");
  });
});
