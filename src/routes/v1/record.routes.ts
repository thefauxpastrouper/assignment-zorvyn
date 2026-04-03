import { Router } from "express";
import { authGuard } from "middleware/auth.guard";
import { statusGuard } from "middleware/status.guard";
import { roleGuard } from "middleware/role.guard";
import { Role } from "@prisma/client";
import * as RecordController from "../../controllers/record.controller";

const recordRoutes = Router();

recordRoutes.use(authGuard, statusGuard);

recordRoutes.get('/', RecordController.listRecords);
recordRoutes.post('/', roleGuard([Role.ADMIN, Role.ANALYST]), RecordController.createRecord);
recordRoutes.put('/:id', roleGuard([Role.ADMIN, Role.ANALYST]), RecordController.updateRecord);
recordRoutes.delete('/:id', roleGuard([Role.ADMIN]), RecordController.deleteRecord);

export default recordRoutes;