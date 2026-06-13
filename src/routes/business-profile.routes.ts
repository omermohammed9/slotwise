import express from "express";
import { BusinessProfileController } from "../controllers/business-profile.controller";
import {
    validateBusinessDomainId,
    validateBusinessSlugParam,
    validateCreateBusinessProfile,
    validateUpdateBusinessProfile,
} from "../middleware/businessDomainValidation";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();
const businessProfileController = new BusinessProfileController();
const requireBusinessManagerRole = requireRole(["owner", "admin"]);

router.post("/", requireBusinessManagerRole, validateCreateBusinessProfile, businessProfileController.createBusinessProfile);
router.get("/", requireBusinessManagerRole, businessProfileController.getAllBusinessProfiles);
router.get("/public/:slug/widget", validateBusinessSlugParam, businessProfileController.getPublicWidgetConfig);
router.get("/public/:slug/booking-page", validateBusinessSlugParam, businessProfileController.getPublicBookingPageConfig);
router.get("/templates", requireBusinessManagerRole, businessProfileController.getBusinessTemplates);
router.get("/templates/:templateKey", requireBusinessManagerRole, businessProfileController.getBusinessTemplateByKey);
router.get("/:id", requireBusinessManagerRole, validateBusinessDomainId, businessProfileController.getBusinessProfileById);
router.patch("/:id", requireBusinessManagerRole, validateBusinessDomainId, validateUpdateBusinessProfile, businessProfileController.updateBusinessProfile);

export default router;
