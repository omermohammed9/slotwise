import { IServiceResource, ServiceResourceType } from "../interfaces/service-resource.interface";
import {
    ServiceResourceListFilters,
    ServiceResourceRepository,
    ServiceResourceRepositoryContract,
} from "../repositories/service-resource.repository";

export interface ServiceResourceListQuery {
    businessId?: string;
    resourceType?: string;
    active?: string;
    name?: string;
}

const resourceTypes: ServiceResourceType[] = [
    "service",
    "staff",
    "room",
    "table",
    "equipment",
    "appointment",
    "event",
];

export class ServiceResourceService {
    private static instance: ServiceResourceService;
    private readonly serviceResourceRepository: ServiceResourceRepositoryContract;

    public constructor(
        serviceResourceRepository: ServiceResourceRepositoryContract = ServiceResourceRepository.getInstance(),
    ) {
        this.serviceResourceRepository = serviceResourceRepository;
    }

    public static getInstance(): ServiceResourceService {
        if (!ServiceResourceService.instance) {
            ServiceResourceService.instance = new ServiceResourceService();
        }

        return ServiceResourceService.instance;
    }

    public async createServiceResource(resourceData: Partial<IServiceResource>): Promise<IServiceResource> {
        try {
            return await this.serviceResourceRepository.create(resourceData);
        } catch (error) {
            throw new Error("Error creating service resource");
        }
    }

    public async getAllServiceResources(query: ServiceResourceListQuery = {}): Promise<IServiceResource[]> {
        try {
            const filters = this.parseListFilters(query);
            return await this.serviceResourceRepository.findAll(filters);
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid service resource list query")) {
                throw error;
            }

            throw new Error("Error getting service resources");
        }
    }

    public async getServiceResourceById(id: string): Promise<IServiceResource | null> {
        try {
            return await this.serviceResourceRepository.findById(id);
        } catch (error) {
            throw new Error("Error getting service resource");
        }
    }

    public async updateServiceResource(
        id: string,
        resourceData: Partial<IServiceResource>,
    ): Promise<IServiceResource | null> {
        try {
            return await this.serviceResourceRepository.updateById(id, resourceData);
        } catch (error) {
            throw new Error("Error updating service resource");
        }
    }

    private parseListFilters(query: ServiceResourceListQuery): ServiceResourceListFilters {
        const filters: ServiceResourceListFilters = {};

        if (query.businessId) {
            filters.businessId = query.businessId.trim();
        }

        if (query.resourceType) {
            if (!resourceTypes.includes(query.resourceType as ServiceResourceType)) {
                throw new Error("Invalid service resource list query: resourceType is not supported");
            }
            filters.resourceType = query.resourceType as ServiceResourceType;
        }

        if (query.active) {
            if (!["true", "false"].includes(query.active)) {
                throw new Error("Invalid service resource list query: active must be true or false");
            }
            filters.active = query.active === "true";
        }

        if (query.name) {
            filters.name = query.name.trim();
        }

        return filters;
    }
}
