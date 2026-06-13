import express from "express";
import { CustomerController } from "../controllers/customer.controller";
import {
    validateBusinessDomainId,
    validateCreateCustomer,
    validateCustomerListQuery,
    validateUpdateCustomer,
} from "../middleware/businessDomainValidation";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();
const customerController = new CustomerController();
const requireBusinessReaderRole = requireRole(["owner", "admin", "staff"]);

router.post("/", requireBusinessReaderRole, validateCreateCustomer, customerController.createCustomer);
router.get("/", requireBusinessReaderRole, validateCustomerListQuery, customerController.getAllCustomers);
router.get("/:id", requireBusinessReaderRole, validateBusinessDomainId, customerController.getCustomerById);
router.patch("/:id", requireBusinessReaderRole, validateBusinessDomainId, validateUpdateCustomer, customerController.updateCustomer);

export default router;
