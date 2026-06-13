import { ICustomer } from "../interfaces/customer.interface";
import { CustomerListFilters, CustomerRepository, CustomerRepositoryContract } from "../repositories/customer.repository";

export interface CustomerListQuery {
    businessId?: string;
    email?: string;
    phone?: string;
    customerName?: string;
}

export class CustomerService {
    private static instance: CustomerService;
    private readonly customerRepository: CustomerRepositoryContract;

    public constructor(customerRepository: CustomerRepositoryContract = CustomerRepository.getInstance()) {
        this.customerRepository = customerRepository;
    }

    public static getInstance(): CustomerService {
        if (!CustomerService.instance) {
            CustomerService.instance = new CustomerService();
        }

        return CustomerService.instance;
    }

    public async createCustomer(customerData: Partial<ICustomer>): Promise<ICustomer> {
        try {
            return await this.customerRepository.create(customerData);
        } catch (error) {
            throw new Error("Error creating customer");
        }
    }

    public async getAllCustomers(query: CustomerListQuery = {}): Promise<ICustomer[]> {
        try {
            const filters = this.parseListFilters(query);
            return await this.customerRepository.findAll(filters);
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid customer list query")) {
                throw error;
            }

            throw new Error("Error getting customers");
        }
    }

    public async getCustomerById(id: string): Promise<ICustomer | null> {
        try {
            return await this.customerRepository.findById(id);
        } catch (error) {
            throw new Error("Error getting customer");
        }
    }

    public async updateCustomer(id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null> {
        try {
            return await this.customerRepository.updateById(id, customerData);
        } catch (error) {
            throw new Error("Error updating customer");
        }
    }

    private parseListFilters(query: CustomerListQuery): CustomerListFilters {
        return {
            ...(query.businessId ? { businessId: query.businessId.trim() } : {}),
            ...(query.email ? { email: query.email.trim() } : {}),
            ...(query.phone ? { phone: query.phone.trim() } : {}),
            ...(query.customerName ? { customerName: query.customerName.trim() } : {}),
        };
    }
}
