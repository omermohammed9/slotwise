import { Request, Response } from "express";
import { ServiceResourceService } from "../services/service-resource.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

export class ServiceResourceController {
    private readonly serviceResourceService: ServiceResourceService;

    public constructor(
        serviceResourceService: ServiceResourceService = ServiceResourceService.getInstance(),
    ) {
        this.serviceResourceService = serviceResourceService;
    }

    public createServiceResource = async (req: Request, res: Response): Promise<Response> => {
        try {
            const resource = await this.serviceResourceService.createServiceResource(req.body);
            return sendSuccess(res, 201, resource);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getAllServiceResources = async (req: Request, res: Response): Promise<Response> => {
        try {
            const resources = await this.serviceResourceService.getAllServiceResources(req.query);
            return sendSuccess(res, 200, resources);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getServiceResourceById = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const resource = await this.serviceResourceService.getServiceResourceById(req.params.id);
            if (!resource) {
                return sendError(res, 404, "Service resource not found");
            }

            return sendSuccess(res, 200, resource);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public updateServiceResource = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const resource = await this.serviceResourceService.updateServiceResource(req.params.id, req.body);
            if (!resource) {
                return sendError(res, 404, "Service resource not found");
            }

            return sendSuccess(res, 200, resource);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };
}
