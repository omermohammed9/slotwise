import { IBusinessProfile } from "../interfaces/business.interface";
import businessProfileModel from "../models/business-profile.model";

export interface BusinessProfileRepositoryContract {
    findAll(): Promise<IBusinessProfile[]>;
    findById(id: string): Promise<IBusinessProfile | null>;
    findBySlug(slug: string): Promise<IBusinessProfile | null>;
    findActiveById(id: string): Promise<IBusinessProfile | null>;
    findActiveBySlug(slug: string): Promise<IBusinessProfile | null>;
    create(profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile>;
    updateById(id: string, profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile | null>;
}

export class BusinessProfileRepository implements BusinessProfileRepositoryContract {
    private static instance: BusinessProfileRepository;

    public static getInstance(): BusinessProfileRepository {
        if (!BusinessProfileRepository.instance) {
            BusinessProfileRepository.instance = new BusinessProfileRepository();
        }

        return BusinessProfileRepository.instance;
    }

    public async findAll(): Promise<IBusinessProfile[]> {
        return businessProfileModel.find().sort({ createdAt: -1 });
    }

    public async findById(id: string): Promise<IBusinessProfile | null> {
        return businessProfileModel.findById(id);
    }

    public async findBySlug(slug: string): Promise<IBusinessProfile | null> {
        return businessProfileModel.findOne({ slug });
    }

    public async findActiveById(id: string): Promise<IBusinessProfile | null> {
        return businessProfileModel.findOne({ _id: id, status: "active" });
    }

    public async findActiveBySlug(slug: string): Promise<IBusinessProfile | null> {
        return businessProfileModel.findOne({ slug, status: "active" });
    }

    public async create(profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
        const profile = new businessProfileModel(profileData);
        await profile.save();
        return profile;
    }

    public async updateById(id: string, profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile | null> {
        return businessProfileModel.findByIdAndUpdate(id, profileData, {
            new: true,
            runValidators: true,
        });
    }
}
