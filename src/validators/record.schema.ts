import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);


const recordTypeEnum = z.enum(["INCOME", "EXPENSE"]);

const recordSchema = z.object({
    amount: z.number({ error: "Amount must be a number" })
        .positive({ error: "Amount must be positive" }).openapi({ example: 100.50, description: "Amount for a particular record like EXPENSE or INCOME" }),
    type: recordTypeEnum.openapi({ example: "EXPENSE", description: "Type of transaction (INCOME or EXPENSE)" }),
    category: z.string({ error: "Category is required" })
        .min(1, { error: "Category cannot be empty" })
        .max(50, { error: "Category must be at most 50 characters" })
        .openapi({ example: "Food", description: "Category of the transaction" }),
    date: z.coerce.date({ error: "Invalid date format" }).optional()
        .openapi({ example: "2024-03-20T00:00:00Z", description: "Date of the transaction" }),
    description: z.string()
        .max(500, { error: "Description must be at most 500 characters" })
        .optional()
        .openapi({ example: "Lunch at office", description: "Optional description of the transaction" }),
});

export const CreateRecordSchema = z.object({
    body: recordSchema.openapi('CreateRecordRequest')
});

export const UpdateRecordSchema = z.object({
    body: recordSchema.partial().openapi('UpdateRecordRequest')
});

export const ListRecordsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1)
            .openapi({ example: 1, description: "Page number for pagination" }),
        limit: z.coerce.number().int().positive().max(100).optional().default(10)
            .openapi({ example: 10, description: "Number of records per page" }),
        q: z.string().trim().optional()
            .openapi({ example: "food", description: "Search query for category or description" }),
        type: recordTypeEnum.optional()
            .openapi({ example: "EXPENSE", description: "Filter by record type" }),
        category: z.string().optional()
            .openapi({ example: "Rent", description: "Filter by category" }),
        startDate: z.coerce.date().optional()
            .openapi({ example: "2024-01-01T00:00:00Z", description: "Filter by start date" }),
        endDate: z.coerce.date().optional()
            .openapi({ example: "2024-12-31T23:59:59Z", description: "Filter by end date" }),
    }).openapi('ListRecordsQuery')
});

export const IdParamSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid ID format. Should be UUID.")
            .openapi({ example: "123e4567-e89b-12d3-a456-426614174000", description: "Unique identifier (UUID) of the record" })
    }),
}).openapi('IdParam');