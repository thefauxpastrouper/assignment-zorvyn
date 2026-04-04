import type { Request, Response } from "express"
import { RecordService } from "services/record.service"
import { errorResponse, successResponse } from "utils/response";

export const createRecord = async (req: Request, res: Response) => {
    try {
        const record = await RecordService.createRecord(req.user!.id, req.body);
        return successResponse(res, record, "Record created successfully")       
    }catch(err: any) {
        return errorResponse(res, err.message)
    }
}

export const listRecords = async (req: Request, res: Response) => {
    const records = await RecordService.getRecords(req.user!.id, req.query);
    return successResponse(res, records, "Success");
}

export const getRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const record = await RecordService.getRecordById(id);
        return successResponse(res, record);
    } catch (err: any) {
        return errorResponse(res, err.message, 404);
    }
}


export const deleteRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await RecordService.deleteRecord(id);
        return successResponse(res, null, "Record deleted successfully");
    } catch (err: any) {
        return errorResponse(res, err.message);
    }
}

export const updateRecord = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const record = await RecordService.updateRecord(id, req.body);
        return successResponse(res, record, "Success");
    }catch(error: any) {
        return  errorResponse(res, error.message)
    }
}
