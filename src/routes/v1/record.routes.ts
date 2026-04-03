import { Router } from "express";
import { authGuard } from "middleware/auth.guard";
import { statusGuard } from "middleware/status.guard";
import { roleGuard } from "middleware/role.guard";
import { Role } from "@prisma/client";
import * as RecordController from "../../controllers/record.controller";
import { validate } from "middleware/validate.middleware";
import { IdParamSchema, CreateRecordSchema, UpdateRecordSchema, ListRecordsQuerySchema } from '../../validators/record.schema';

const recordRoutes = Router();

recordRoutes.use(authGuard, statusGuard);

recordRoutes.get('/', 
  validate(ListRecordsQuerySchema), 
  RecordController.listRecords
);

recordRoutes.get('/:id', 
  validate(IdParamSchema), 
  RecordController.getRecord
);

recordRoutes.post('/', 
  roleGuard([Role.ADMIN, Role.ANALYST]), 
  validate(CreateRecordSchema), 
  RecordController.createRecord
);

recordRoutes.put('/:id', 
  roleGuard([Role.ADMIN, Role.ANALYST]), 
  validate(IdParamSchema), 
  validate(UpdateRecordSchema), 
  RecordController.updateRecord
);

recordRoutes.delete('/:id', 
  roleGuard([Role.ADMIN]), 
  validate(IdParamSchema), 
  RecordController.deleteRecord
);

export default recordRoutes;