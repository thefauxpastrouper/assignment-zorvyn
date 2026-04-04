import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/record.service', () => ({
  RecordService: {
    createRecord: vi.fn(),
    getRecords: vi.fn(),
    getRecordById: vi.fn(),
    deleteRecord: vi.fn(),
    updateRecord: vi.fn(),
  },
}));

import * as RecordController from '../controllers/record.controller';
import { RecordService } from '../services/record.service';

const mockedRecordService = RecordService as any;

const createResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as any;
};

describe('RecordController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a record and returns success response', async () => {
    const expected = { id: 'rec-1' };
    mockedRecordService.createRecord.mockResolvedValue(expected);

    const req = { user: { id: 'user-1' }, body: { amount: 100 } } as any;
    const res = createResponse();

    await RecordController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Record created successfully',
      data: expected,
    });
  });

  it('returns a 400 error response when createRecord throws', async () => {
    mockedRecordService.createRecord.mockRejectedValue(new Error('Create failed'));

    const req = { user: { id: 'user-1' }, body: { amount: 100 } } as any;
    const res = createResponse();

    await RecordController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Create failed',
    });
  });

  it('lists records successfully', async () => {
    const expected = { records: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockedRecordService.getRecords.mockResolvedValue(expected);

    const req = { user: { id: 'user-1' }, query: {} } as any;
    const res = createResponse();

    await RecordController.listRecords(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Successs',
      data: expected,
    });
  });

  it('returns 404 when record not found', async () => {
    mockedRecordService.getRecordById.mockRejectedValue(new Error('Record not found'));

    const req = { params: { id: 'missing' } } as any;
    const res = createResponse();

    await RecordController.getRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Record not found',
    });
  });

  it('deletes a record successfully', async () => {
    mockedRecordService.deleteRecord.mockResolvedValue(null);

    const req = { params: { id: 'rec-1' } } as any;
    const res = createResponse();

    await RecordController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Record deleted successfully',
      data: null,
    });
  });

  it('updates a record successfully', async () => {
    const expected = { id: 'rec-1', category: 'Travel' };
    mockedRecordService.updateRecord.mockResolvedValue(expected);

    const req = { params: { id: 'rec-1' }, body: { category: 'Travel' } } as any;
    const res = createResponse();

    await RecordController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Successs',
      data: expected,
    });
  });
});
