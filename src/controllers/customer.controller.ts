import { Request, Response } from "express";
import { CustomerService } from "../services/customer.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

export class CustomerController {
    private readonly customerService: CustomerService;

    public constructor(customerService: CustomerService = CustomerService.getInstance()) {
        this.customerService = customerService;
    }

    public createCustomer = async (req: Request, res: Response): Promise<Response> => {
        try {
            const customer = await this.customerService.createCustomer(req.body);
            return sendSuccess(res, 201, customer);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getAllCustomers = async (req: Request, res: Response): Promise<Response> => {
        try {
            const customers = await this.customerService.getAllCustomers(req.query);
            return sendSuccess(res, 200, customers);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public getCustomerById = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const customer = await this.customerService.getCustomerById(req.params.id);
            if (!customer) {
                return sendError(res, 404, "Customer not found");
            }

            return sendSuccess(res, 200, customer);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public updateCustomer = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
        try {
            const customer = await this.customerService.updateCustomer(req.params.id, req.body);
            if (!customer) {
                return sendError(res, 404, "Customer not found");
            }

            return sendSuccess(res, 200, customer);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };
}
