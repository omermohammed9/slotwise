import { IServiceResource, ServiceResourceType } from "../interfaces/service-resource.interface";
import serviceResourceModel from "../models/service-resource.model";
import {
    buildCaseInsensitivePrefixSearchRegex,
    buildPrefixSearchRegex,
    buildServiceResourceSearchFields,
    normalizeNameSearch,
} from "../utils/searchNormalization";

export interface ServiceResourceListFilters {
    businessId?: string;
    resourceType?: ServiceResourceType;
    active?: boolean;
    name?: string;
}

export interface ServiceResourceRepositoryContract {
    findAll(filters?: ServiceResourceListFilters): Promise<IServiceResource[]>;
    findById(id: string): Promise<IServiceResource | null>;
    create(resourceData: Partial<IServiceResource>): Promise<IServiceResource>;
    updateById(id: string, resourceData: Partial<IServiceResource>): Promise<IServiceResource | null>;
}

export class ServiceResourceRepository implements ServiceResourceRepositoryContract {
    private static instance: ServiceResourceRepository;

    public static getInstance(): ServiceResourceRepository {
        if (!ServiceResourceRepository.instance) {
            ServiceResourceRepository.instance = new ServiceResourceRepository();
        }

        return ServiceResourceRepository.instance;
    }

    public async findAll(filters: ServiceResourceListFilters = {}): Promise<IServiceResource[]> {
        const query = this.buildListQuery(filters);
        return serviceResourceModel.find(query).sort({ resourceType: 1, nameNormalized: 1 });
    }

    public async findById(id: string): Promise<IServiceResource | null> {
        return serviceResourceModel.findById(id);
    }

    public async create(resourceData: Partial<IServiceResource>): Promise<IServiceResource> {
        const resource = new serviceResourceModel({
            ...resourceData,
            ...buildServiceResourceSearchFields(resourceData),
        });
        await resource.save();
        return resource;
    }

    public async updateById(id: string, resourceData: Partial<IServiceResource>): Promise<IServiceResource | null> {
        return serviceResourceModel.findByIdAndUpdate(id, {
            ...resourceData,
            ...buildServiceResourceSearchFields(resourceData),
        }, {
            returnDocument: "after",
            runValidators: true,
        });
    }

    private buildListQuery(filters: ServiceResourceListFilters): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filters.businessId) {
            query.businessId = filters.businessId;
        }

        if (filters.resourceType) {
            query.resourceType = filters.resourceType;
        }

        if (filters.active !== undefined) {
            query.active = filters.active;
        }

        if (filters.name) {
            query.$or = [
                { nameNormalized: buildPrefixSearchRegex(normalizeNameSearch(filters.name)) },
                { name: buildCaseInsensitivePrefixSearchRegex(filters.name.trim()) },
            ];
        }

        return query;
    }
}
