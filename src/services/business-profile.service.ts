import {
    BusinessPublicPageSettings,
    BusinessTemplatePreset,
    BusinessWidgetSettings,
    IBusinessProfile,
} from "../interfaces/business.interface";
import { BusinessProfileRepository, BusinessProfileRepositoryContract } from "../repositories/business-profile.repository";
import { ServiceResourceRepository, ServiceResourceRepositoryContract } from "../repositories/service-resource.repository";
import { businessTemplatePresets, getBusinessTemplatePreset } from "../utils/businessTemplates";

export interface PublicWidgetResourcePreview {
    id: string;
    name: string;
    resourceType: string;
    capacity: number;
    durationMinutes?: number;
    requiresApproval: boolean;
}

export interface PublicBusinessWidgetConfig {
    businessId: string;
    name: string;
    slug: string;
    businessType: string;
    timezone: string;
    description?: string;
    widgetSettings: BusinessWidgetSettings;
    availableResources: PublicWidgetResourcePreview[];
    bookingEndpoints: {
        createBooking: string;
        suggestions: string;
    };
}

export interface PublicBusinessBookingPageConfig {
    businessId: string;
    name: string;
    slug: string;
    businessType: string;
    timezone: string;
    description?: string;
    contactDetails?: {
        email: string;
        phone: string;
    };
    workingHours?: IBusinessProfile["workingHours"];
    widgetSettings?: BusinessWidgetSettings;
    publicPageSettings: BusinessPublicPageSettings;
    availableResources: PublicWidgetResourcePreview[];
    bookingEndpoints: {
        createBooking: string;
        suggestions: string;
    };
}

export class BusinessProfileService {
    private static instance: BusinessProfileService;
    private readonly businessProfileRepository: BusinessProfileRepositoryContract;
    private readonly serviceResourceRepository: ServiceResourceRepositoryContract;

    public constructor(
        businessProfileRepository: BusinessProfileRepositoryContract = BusinessProfileRepository.getInstance(),
        serviceResourceRepository: ServiceResourceRepositoryContract = ServiceResourceRepository.getInstance(),
    ) {
        this.businessProfileRepository = businessProfileRepository;
        this.serviceResourceRepository = serviceResourceRepository;
    }

    public static getInstance(): BusinessProfileService {
        if (!BusinessProfileService.instance) {
            BusinessProfileService.instance = new BusinessProfileService();
        }

        return BusinessProfileService.instance;
    }

    public async createBusinessProfile(profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
        try {
            return await this.businessProfileRepository.create(this.applyTemplatePreset(profileData));
        } catch (error) {
            throw this.wrapBusinessProfileError(error, "Error creating business profile");
        }
    }

    public async getAllBusinessProfiles(): Promise<IBusinessProfile[]> {
        try {
            return await this.businessProfileRepository.findAll();
        } catch (error) {
            throw new Error("Error getting business profiles");
        }
    }

    public async getBusinessProfileById(id: string): Promise<IBusinessProfile | null> {
        try {
            return await this.businessProfileRepository.findById(id);
        } catch (error) {
            throw new Error("Error getting business profile");
        }
    }

    public getBusinessTemplates(): BusinessTemplatePreset[] {
        return businessTemplatePresets;
    }

    public getBusinessTemplateByKey(key: string): BusinessTemplatePreset | null {
        return getBusinessTemplatePreset(key);
    }

    public async getPublicWidgetConfig(slug: string): Promise<PublicBusinessWidgetConfig | null> {
        const businessProfile = await this.businessProfileRepository.findActiveBySlug(slug);
        if (!businessProfile || !businessProfile.widgetSettings?.enabled) {
            return null;
        }

        const activeResources = await this.serviceResourceRepository.findAll({
            businessId: String(businessProfile._id),
            active: true,
        });

        return {
            businessId: String(businessProfile._id),
            name: businessProfile.name,
            slug: businessProfile.slug,
            businessType: businessProfile.businessType,
            timezone: businessProfile.timezone,
            ...(businessProfile.widgetSettings.showBusinessDescription && businessProfile.description
                ? { description: businessProfile.description }
                : {}),
            widgetSettings: businessProfile.widgetSettings,
            availableResources: activeResources.map((resource) => ({
                id: String(resource._id),
                name: resource.name,
                resourceType: resource.resourceType,
                capacity: resource.capacity,
                ...(resource.durationMinutes ? { durationMinutes: resource.durationMinutes } : {}),
                requiresApproval: resource.requiresApproval,
            })),
            bookingEndpoints: {
                createBooking: "/bookings",
                suggestions: "/bookings/suggestions",
            },
        };
    }

    public async getPublicBookingPageConfig(slug: string): Promise<PublicBusinessBookingPageConfig | null> {
        const businessProfile = await this.businessProfileRepository.findActiveBySlug(slug);
        if (!businessProfile || !businessProfile.publicPageSettings?.enabled) {
            return null;
        }

        const activeResources = businessProfile.publicPageSettings.showAvailableResources
            ? await this.serviceResourceRepository.findAll({
                businessId: String(businessProfile._id),
                active: true,
            })
            : [];

        return {
            businessId: String(businessProfile._id),
            name: businessProfile.name,
            slug: businessProfile.slug,
            businessType: businessProfile.businessType,
            timezone: businessProfile.timezone,
            ...(businessProfile.publicPageSettings.showBusinessDescription && businessProfile.description
                ? { description: businessProfile.description }
                : {}),
            ...(businessProfile.publicPageSettings.showContactDetails
                ? {
                    contactDetails: {
                        email: businessProfile.contactEmail,
                        phone: businessProfile.contactPhone,
                    },
                }
                : {}),
            ...(businessProfile.publicPageSettings.showWorkingHours
                ? { workingHours: businessProfile.workingHours }
                : {}),
            ...(businessProfile.widgetSettings ? { widgetSettings: businessProfile.widgetSettings } : {}),
            publicPageSettings: businessProfile.publicPageSettings,
            availableResources: activeResources.map((resource) => ({
                id: String(resource._id),
                name: resource.name,
                resourceType: resource.resourceType,
                capacity: resource.capacity,
                ...(resource.durationMinutes ? { durationMinutes: resource.durationMinutes } : {}),
                requiresApproval: resource.requiresApproval,
            })),
            bookingEndpoints: {
                createBooking: "/bookings",
                suggestions: "/bookings/suggestions",
            },
        };
    }

    public async updateBusinessProfile(
        id: string,
        profileData: Partial<IBusinessProfile>,
    ): Promise<IBusinessProfile | null> {
        try {
            return await this.businessProfileRepository.updateById(id, this.applyTemplatePreset(profileData));
        } catch (error) {
            throw this.wrapBusinessProfileError(error, "Error updating business profile");
        }
    }

    private applyTemplatePreset(profileData: Partial<IBusinessProfile>): Partial<IBusinessProfile> {
        if (!profileData.templateKey) {
            return profileData;
        }

        const template = getBusinessTemplatePreset(String(profileData.templateKey));
        if (!template) {
            throw new Error("Business template not found");
        }

        return {
            ...profileData,
            businessType: profileData.businessType ?? template.businessType,
            availabilityRules: {
                ...template.availabilityRules,
                ...(profileData.availabilityRules ?? {}),
            },
            workingHours: profileData.workingHours ?? template.workingHours,
            notificationSettings: {
                ...template.notificationSettings,
                ...(profileData.notificationSettings ?? {}),
                enabledChannels: profileData.notificationSettings?.enabledChannels ?? template.notificationSettings.enabledChannels,
                reminderLeadHours: profileData.notificationSettings?.reminderLeadHours ?? template.notificationSettings.reminderLeadHours,
            },
            widgetSettings: {
                ...template.widgetSettings,
                ...(profileData.widgetSettings ?? {}),
            },
            publicPageSettings: {
                ...template.publicPageSettings,
                ...(profileData.publicPageSettings ?? {}),
            },
        };
    }

    private wrapBusinessProfileError(error: unknown, fallbackMessage: string): Error {
        const duplicateKeyCode = 11000;
        if (
            typeof error === "object"
            && error !== null
            && "code" in error
            && error.code === duplicateKeyCode
        ) {
            return new Error("Business profile slug already exists");
        }

        return new Error(fallbackMessage);
    }
}
