import mongoose from "mongoose";
import { IBooking } from "../interfaces/booking.interface";
import { ICustomer } from "../interfaces/customer.interface";
import customerModel from "../models/customer.model";
import {
    buildCaseInsensitivePrefixSearchRegex,
    buildCustomerSearchFields,
    buildLoosePhoneSearchRegex,
    buildPrefixSearchRegex,
    normalizeEmailSearch,
    normalizeNameSearch,
    normalizePhoneSearch,
} from "../utils/searchNormalization";

export interface CustomerListFilters {
    businessId?: string;
    email?: string;
    phone?: string;
    customerName?: string;
}

export interface CustomerRepositoryContract {
    findAll(filters?: CustomerListFilters): Promise<ICustomer[]>;
    findById(id: string): Promise<ICustomer | null>;
    findByBusinessAndEmail(businessId: string, email: string): Promise<ICustomer | null>;
    create(customerData: Partial<ICustomer>): Promise<ICustomer>;
    updateById(id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null>;
    upsertFromBooking(bookingData: IBooking): Promise<ICustomer>;
    incrementBookingCount(customerId: string, bookingDate: Date): Promise<void>;
}

export class CustomerRepository implements CustomerRepositoryContract {
    private static instance: CustomerRepository;

    public static getInstance(): CustomerRepository {
        if (!CustomerRepository.instance) {
            CustomerRepository.instance = new CustomerRepository();
        }

        return CustomerRepository.instance;
    }

    public async findAll(filters: CustomerListFilters = {}): Promise<ICustomer[]> {
        const query = this.buildListQuery(filters);
        return customerModel.find(query).sort({ lastNameNormalized: 1, firstNameNormalized: 1 });
    }

    public async findById(id: string): Promise<ICustomer | null> {
        return customerModel.findById(id);
    }

    public async findByBusinessAndEmail(businessId: string, email: string): Promise<ICustomer | null> {
        return customerModel.findOne({
            businessId: new mongoose.Types.ObjectId(businessId),
            emailNormalized: normalizeEmailSearch(email),
        });
    }

    public async create(customerData: Partial<ICustomer>): Promise<ICustomer> {
        const customer = new customerModel({
            ...customerData,
            ...buildCustomerSearchFields(customerData),
        });
        await customer.save();
        return customer;
    }

    public async updateById(id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null> {
        return customerModel.findByIdAndUpdate(id, {
            ...customerData,
            ...buildCustomerSearchFields(customerData),
        }, {
            returnDocument: "after",
            runValidators: true,
        });
    }

    public async upsertFromBooking(bookingData: IBooking): Promise<ICustomer> {
        const businessId = String(bookingData.businessId);

        const customer = await customerModel.findOneAndUpdate(
            {
                businessId: new mongoose.Types.ObjectId(businessId),
                emailNormalized: normalizeEmailSearch(bookingData.email),
            },
            {
                $set: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    firstName: bookingData.fName,
                    lastName: bookingData.lName,
                    email: bookingData.email,
                    phone: bookingData.phone,
                    lastBookingAt: bookingData.startDate,
                    ...buildCustomerSearchFields({
                        firstName: bookingData.fName,
                        lastName: bookingData.lName,
                        email: bookingData.email,
                        phone: bookingData.phone,
                    }),
                },
                $setOnInsert: {
                    preferredNotificationChannels: ["email"],
                    totalBookings: 0,
                },
            },
            {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
                includeResultMetadata: false,
            },
        );

        if (!customer) {
            throw new Error("Customer upsert failed");
        }

        return customer;
    }

    public async incrementBookingCount(customerId: string, bookingDate: Date): Promise<void> {
        await customerModel.findByIdAndUpdate(customerId, {
            $inc: { totalBookings: 1 },
            $set: { lastBookingAt: bookingDate },
        });
    }

    private buildListQuery(filters: CustomerListFilters): Record<string, unknown> {
        const query: Record<string, unknown> = {};
        const andConditions: Record<string, unknown>[] = [];

        if (filters.businessId) {
            query.businessId = filters.businessId;
        }

        if (filters.email) {
            andConditions.push({
                $or: [
                    { emailNormalized: buildPrefixSearchRegex(normalizeEmailSearch(filters.email)) },
                    { email: buildCaseInsensitivePrefixSearchRegex(filters.email.trim()) },
                ],
            });
        }

        if (filters.phone) {
            const normalizedPhone = normalizePhoneSearch(filters.phone);
            andConditions.push({
                $or: [
                    { phoneNormalized: buildPrefixSearchRegex(normalizedPhone) },
                    { phone: buildLoosePhoneSearchRegex(normalizedPhone) },
                ],
            });
        }

        if (filters.customerName) {
            const normalizedName = normalizeNameSearch(filters.customerName);
            andConditions.push({
                $or: [
                    { firstNameNormalized: buildPrefixSearchRegex(normalizedName) },
                    { lastNameNormalized: buildPrefixSearchRegex(normalizedName) },
                    { firstName: buildCaseInsensitivePrefixSearchRegex(filters.customerName.trim()) },
                    { lastName: buildCaseInsensitivePrefixSearchRegex(filters.customerName.trim()) },
                ],
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        return query;
    }
}
