import express from "express";
import { ServiceResourceController } from "../controllers/service-resource.controller";
import {
    validateBusinessDomainId,
    validateCreateServiceResource,
    validateServiceResourceListQuery,
    validateUpdateServiceResource,
} from "../middleware/businessDomainValidation";
import { requireBusinessScopeAccess, requireResolvedBusinessScopeAccess } from "../middleware/businessAuthorization";
import { requireRole } from "../middleware/requireRole";
import { ServiceResourceRepository } from "../repositories/service-resource.repository";

const router = express.Router();
const serviceResourceController = new ServiceResourceController();
const serviceResourceRepository = ServiceResourceRepository.getInstance();
const requireBusinessManagerRole = requireRole(["owner", "admin", "staff"]);
const requireServiceResourceBusinessScopeAccess = requireResolvedBusinessScopeAccess(async (req) => {
    if (typeof req.params.id !== "string") {
        return null;
    }

    const serviceResource = await serviceResourceRepository.findById(req.params.id);
    return serviceResource?.businessId ? String(serviceResource.businessId) : null;
});

router.post("/", requireBusinessManagerRole, requireBusinessScopeAccess, validateCreateServiceResource, serviceResourceController.createServiceResource);
router.get("/", requireBusinessManagerRole, validateServiceResourceListQuery, requireBusinessScopeAccess, serviceResourceController.getAllServiceResources);
router.get("/:id", requireBusinessManagerRole, validateBusinessDomainId, requireServiceResourceBusinessScopeAccess, serviceResourceController.getServiceResourceById);
router.patch("/:id", requireBusinessManagerRole, validateBusinessDomainId, requireServiceResourceBusinessScopeAccess, validateUpdateServiceResource, serviceResourceController.updateServiceResource);

export default router;
