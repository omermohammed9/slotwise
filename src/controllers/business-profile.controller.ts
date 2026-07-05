import { Request, Response } from "express";
import { AuditLogService } from "../services/audit-log.service";
import { BusinessProfileService } from "../services/business-profile.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

export class BusinessProfileController {
    private readonly businessProfileService: BusinessProfileService;
    private readonly auditLogService: AuditLogService;

    public constructor(
        businessProfileService: BusinessProfileService = BusinessProfileService.getInstance(),
        auditLogService: AuditLogService = AuditLogService.getInstance(),
    ) {
        this.businessProfileService = businessProfileService;
        this.auditLogService = auditLogService;
    }

    public createBusinessProfile = async (req: Request, res: Response): Promise<Response> => {
        try {
            const profile = await this.businessProfileService.createBusinessProfile(req.body);
            await this.auditLogService.record({
                actor: req.slotwiseSession,
                action: "business.created",
                targetEntity: "business",
                targetId: String(profile._id),
                businessId: String(profile._id),
                requestId: req.requestId,
            });
            return sendSuccess(res, 201, profile);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getAllBusinessProfiles = async (req: Request, res: Response): Promise<Response> => {
        try {
            const businessId = typeof req.query.businessId === "string" ? req.query.businessId : undefined;
            const profiles = await this.businessProfileService.getAllBusinessProfiles({ businessId });
            return sendSuccess(res, 200, profiles);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getBusinessTemplates = async (_req: Request, res: Response): Promise<Response> => {
        try {
            return sendSuccess(res, 200, this.businessProfileService.getBusinessTemplates());
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getBusinessTemplateByKey = async (req: Request<{ templateKey: string }>, res: Response): Promise<Response> => {
        try {
            const template = this.businessProfileService.getBusinessTemplateByKey(req.params.templateKey);
            if (!template) {
                return sendError(res, 404, "Business template not found");
            }

            return sendSuccess(res, 200, template);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getPublicWidgetConfig = async (req: Request<{ slug: string }>, res: Response): Promise<Response> => {
        try {
            const config = await this.businessProfileService.getPublicWidgetConfig(req.params.slug);
            if (!config) {
                return sendError(res, 404, "Public widget configuration not found");
            }

            return sendSuccess(res, 200, config);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getPublicBookingPageConfig = async (req: Request<{ slug: string }>, res: Response): Promise<Response> => {
        try {
            const config = await this.businessProfileService.getPublicBookingPageConfig(req.params.slug);
            if (!config) {
                return sendError(res, 404, "Public booking page configuration not found");
            }

            return sendSuccess(res, 200, config);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getBusinessProfileById = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const profile = await this.businessProfileService.getBusinessProfileById(req.params.id);
            if (!profile) {
                return sendError(res, 404, "Business profile not found");
            }

            return sendSuccess(res, 200, profile);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public updateBusinessProfile = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const profile = await this.businessProfileService.updateBusinessProfile(req.params.id, req.body);
            if (!profile) {
                return sendError(res, 404, "Business profile not found");
            }

            await this.auditLogService.record({
                actor: req.slotwiseSession,
                action: "business.updated",
                targetEntity: "business",
                targetId: String(profile._id),
                businessId: String(profile._id),
                requestId: req.requestId,
            });
            return sendSuccess(res, 200, profile);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };
}
