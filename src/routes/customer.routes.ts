import express from "express";
import { CustomerController } from "../controllers/customer.controller";
import {
    validateBusinessDomainId,
    validateCreateCustomer,
    validateCustomerListQuery,
    validateUpdateCustomer,
} from "../middleware/businessDomainValidation";
import { requireBusinessScopeAccess, requireResolvedBusinessScopeAccess } from "../middleware/businessAuthorization";
import { requireRole } from "../middleware/requireRole";
import { CustomerRepository } from "../repositories/customer.repository";

const router = express.Router();
const customerController = new CustomerController();
const customerRepository = CustomerRepository.getInstance();
const requireBusinessReaderRole = requireRole(["owner", "admin", "staff"]);
const requireCustomerBusinessScopeAccess = requireResolvedBusinessScopeAccess(async (req) => {
    if (typeof req.params.id !== "string") {
        return null;
    }

    const customer = await customerRepository.findById(req.params.id);
    return customer?.businessId ? String(customer.businessId) : null;
});

router.post("/", requireBusinessReaderRole, requireBusinessScopeAccess, validateCreateCustomer, customerController.createCustomer);
router.get("/", requireBusinessReaderRole, validateCustomerListQuery, requireBusinessScopeAccess, customerController.getAllCustomers);
router.get("/:id", requireBusinessReaderRole, validateBusinessDomainId, requireCustomerBusinessScopeAccess, customerController.getCustomerById);
router.patch("/:id", requireBusinessReaderRole, validateBusinessDomainId, requireCustomerBusinessScopeAccess, validateUpdateCustomer, customerController.updateCustomer);

export default router;
