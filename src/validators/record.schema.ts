import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);


const recordTypeEnum = z.enum(["INCOME", "EXPENSE"]);

const recordSchema = z.object({
    amount: z.number({ error: "Amount must be a number" })
        .positive({ error: "Amount must be positive" }),
    type: recordTypeEnum,
    category: z.string({ error: "Category is required" })
        .min(1, { error: "Category cannot be empty" })
        .max(50, { error: "Category must be at most 50 characters" }),
    date: z.coerce.date({ error: "Invalid date format" }).optional(),
    description: z.string()
        .max(500, { error: "Description must be at most 500 characters" })
        .optional(),
});

export const CreateRecordSchema = z.object({
    body: recordSchema.openapi('CreateRecordRequest')
});

export const UpdateRecordSchema = z.object({
    body: recordSchema.partial().openapi('UpdateRecordRequest')
});

export const ListRecordsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(10),
        q: z.string().trim().optional(),
        type: recordTypeEnum.optional(),
        category: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }).openapi('ListRecordsQuery')
});


export const IdParamSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid ID format. Should be UUID.")
    }),
}).openapi('IdParam');