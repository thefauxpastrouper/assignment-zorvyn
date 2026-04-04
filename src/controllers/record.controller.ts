import type { Request, Response } from "express"
import { RecordService } from "services/record.service"
import { successResponse } from "utils/response";
import { respondWithError } from "utils/clientError";

export const createRecord = async (req: Request, res: Response) => {
    try {
        const record = await RecordService.createRecord(req.user!.id, req.body);
        return successResponse(res, record, "Record created successfully")       
    } catch (error: unknown) {
        return respondWithError(res, error, { context: "records.create" });
    }
}

export const listRecords = async (req: Request, res: Response) => {
    try {
        const records = await RecordService.getRecords(req.user!.id, req.query);
        return successResponse(res, records, "Success");
    } catch (error: unknown) {
        return respondWithError(res, error, { context: "records.list" });
    }
}

export const getRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const record = await RecordService.getRecordById(id);
        return successResponse(res, record);
    } catch (error: unknown) {
        return respondWithError(res, error, {
            defaultStatus: 404,
            context: "records.get",
        });
    }
}


export const deleteRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await RecordService.deleteRecord(id);
        return successResponse(res, null, "Record deleted successfully");
    } catch (error: unknown) {
        return respondWithError(res, error, { context: "records.delete" });
    }
}

export const updateRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const record = await RecordService.updateRecord(id, req.body);
        return successResponse(res, record, "Success");
    } catch (error: unknown) {
        return respondWithError(res, error, { context: "records.update" });
    }
}
