
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import zodError from "../errors/zodError";
import { JsonWebTokenError } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { AxiosError } from "axios";
import { Prisma } from "../../generated/prisma/client";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong!";
  let success = false;
  let errorDetails = null;
  let error = err;

  const prismaErrorPatterns: {
    pattern: RegExp;
    message: (match: RegExpMatchArray) => string;
  }[] = [
    // 🔹 Missing argument
    {
      pattern: /Argument `(.+)` is missing/,
      message: (match) => `${match[1]} is required.`,
    },

    // 🔹 Unknown argument
    {
      pattern: /Unknown argument `(.+?)`. Available options are (.+)/,
      message: (match) =>
        `Unknown argument '${match[1]}'. Available options are: ${match[2].trim()}`,
    },

    // 🔹 Invalid field type
    {
      pattern: /Field `(.+?)` of type `(.+?)` is invalid/,
      message: (match) => `Invalid field '${match[1]}' of type '${match[2]}'.`,
    },

    // 🔹 Unique constraint failed (generic Prisma)
    {
      pattern: /Unique constraint failed on the fields: \((.+)\)/,
      message: (match) => `Unique constraint failed on the fields: ${match[1]}`,
    },

    // 🔹 Unique constraint (Mongo index name)
    {
      pattern: /Unique constraint failed on the constraint: `(.+?)`/,
      message: (match) =>
        `A unique constraint violation occurred on '${match[1]}'. Ensure the value is unique.`,
    },

    // 🔹 Where clause needs at least one argument
    {
      pattern: /Argument `where` of type (.+?) needs at least one of (.+?) arguments/,
      message: (match) => `The 'where' clause requires at least one of: ${match[2].trim()}`,
    },

    // 🔹 Invalid value (serialization issue)
    {
      pattern: /Invalid value for argument `(.+)`: We could not serialize \[object (.+?)\] value/,
      message: (match) =>
        `Invalid value for '${match[1]}'. Value '[object ${match[2]}]' could not be serialized.`,
    },

    // 🔹 Conversion error (type mismatch)
    {
      pattern:
        /Error converting field "(.+?)" of expected non-nullable type "(.+?)", found incompatible value of "(.+?)"\./,
      message: (match) =>
        `Error converting '${match[1]}' of type '${match[2]}'. Found: '${match[3]}'.`,
    },

    // 🔹 Record not found (generic)
    {
      pattern: /No record was found for a query/,
      message: () => `The requested record was not found.`,
    },

    // 🔹 Record not found (required relation)
    {
      pattern:
        /An operation failed because it depends on one or more records that were required but not found\. No record was found for a query\./,
      message: () => `The requested record was not found. Please verify the provided information.`,
    },

    // 🔹 Record not found (delete)
    {
      pattern:
        /An operation failed because it depends on one or more records that were required but not found\. No record was found for a delete\./,
      message: () => `The record you tried to delete does not exist or was already deleted.`,
    },

    // 🔹 Malformed ObjectID (Mongo-specific)
    {
      pattern:
        /Malformed ObjectID: provided hex string representation must be exactly (\d+) bytes, instead got: "(.+?)", length (\d+)\./,
      message: (match) =>
        `Malformed ObjectID: expected ${match[1]} bytes, but got '${match[2]}' with length ${match[3]}.`,
    },

    // 🔹 BSON parsing error
    {
      pattern: /Invalid BSON field: (.+)/,
      message: (match) => `Invalid BSON field: ${match[1]}. Ensure correct MongoDB BSON format.`,
    },

    // 🔹 Document exceeds size limit (MongoDB limit is 16MB)
    {
      pattern: /BSONObj size: (\d+) is invalid. Size must be less than (\d+)/,
      message: (match) => `Document size ${match[1]} bytes exceeds limit of ${match[2]} bytes.`,
    },

    // 🔹 Duplicate key (Mongo index violation)
    {
      pattern: /E11000 duplicate key error collection: (.+?) index: (.+?) dup key: (.+)/,
      message: (match) =>
        `Duplicate key error in collection '${match[1]}' on index '${match[2]}'. Conflicting value: ${match[3]}.`,
    },

    // 🔹 Invalid update operator (MongoDB update misuse)
    {
      pattern: /Unknown update operator: (.+)/,
      message: (match) => `Unknown MongoDB update operator '${match[1]}'.`,
    },

    // 🔹 Required relation missing (Mongo Prisma)
    {
      pattern: /No record was found for an update\./,
      message: () => `Update operation failed: no matching record was found.`,
    },
    // 🔹 Invalid value provided for nested or relational field (e.g., postComments, postLikes)
    {
      pattern: /Argument `(.+?)`: Invalid value provided\. Expected (.+?), provided \((.*?)\)\./,
      message: (match) =>
        `Invalid value for '${match[1]}'. Expected ${match[2]}, but got (${
          match[3] || "empty value"
        }).`,
    },
  ];

  if (err instanceof ZodError) {
    const zod = zodError(err);
    statusCode = zod.statusCode;
    message = zod.message;
    errorDetails = zod.errorDetails;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = StatusCodes.BAD_REQUEST;

    // Attempt to match error message to regex patterns
    for (const { pattern, message: formatMessage } of prismaErrorPatterns) {
      const match = err.message.match(pattern);
      if (match) {
        message = formatMessage(match as RegExpMatchArray);
        break;
      }
    }

    if (!message) {
      // Handle specific Prisma error codes as a fallback
      if (err.code === "P2002") {
        statusCode = StatusCodes.CONFLICT;
        const duplicateField = err.meta?.target ? (err.meta.target as string) : "unknown field";
        message = `Duplicate value for ${duplicateField}.`;
        errorDetails = err.meta;
      } else if (err.code === "P2003") {
        statusCode = StatusCodes.BAD_REQUEST;
        message = `${err.meta?.field_name || "A foreign key constraint"} is violated.`;
      } else if (err.code === "P2025") {
        statusCode = StatusCodes.NOT_FOUND;
        message = err.meta?.cause || "Resource not found.";
      }
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;

    // Match validation errors using regex patterns
    for (const { pattern, message: formatMessage } of prismaErrorPatterns) {
      const match = err.message.match(pattern);
      if (match) {
        message = formatMessage(match as RegExpMatchArray);
        break;
      }
    }

    if (!message) {
      message = "Validation error occurred.";
    }
  } else if (err instanceof JsonWebTokenError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = err.message;
  } else if (err instanceof AppError) {
    statusCode = err.statuscode;
    message = err.message;
  } else if (err instanceof AxiosError) {
    statusCode = err.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message;
  }

  if (err instanceof AxiosError) {
    console.log(err.response?.data);
  } else {
    console.log(err);
  }

  res.status(statusCode).json({
    success,
    message,
    errorDetails,
    error,
  });
};

export default globalErrorHandler;
