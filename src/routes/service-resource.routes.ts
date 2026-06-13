import express from "express";
import { ServiceResourceController } from "../controllers/service-resource.controller";
import {
    validateBusinessDomainId,
    validateCreateServiceResource,
    validateServiceResourceListQuery,
    validateUpdateServiceResource,
} from "../middleware/businessDomainValidation";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();
const serviceResourceController = new ServiceResourceController();
const requireBusinessManagerRole = requireRole(["owner", "admin", "staff"]);

router.post("/", requireBusinessManagerRole, validateCreateServiceResource, serviceResourceController.createServiceResource);
router.get("/", requireBusinessManagerRole, validateServiceResourceListQuery, serviceResourceController.getAllServiceResources);
router.get("/:id", requireBusinessManagerRole, validateBusinessDomainId, serviceResourceController.getServiceResourceById);
router.patch("/:id", requireBusinessManagerRole, validateBusinessDomainId, validateUpdateServiceResource, serviceResourceController.updateServiceResource);

export default router;
