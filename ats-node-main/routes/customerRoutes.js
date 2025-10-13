import express from 'express';
import { customerController } from '../controllers/customerController.js';
import { companyAuth, requireCompany } from '../middlewares/companyAuth.js';

const router = express.Router();

// Apply company authentication to all customer routes
router.use(companyAuth);

// Customer Routes - Only 4 basic APIs
router.get('/customers', customerController.getAllCustomers);
router.post('/customers', requireCompany, customerController.createCustomer);
router.put('/customers/:id', requireCompany, customerController.updateCustomer);
router.delete('/customers/:id', requireCompany, customerController.deleteCustomer);

export default router; 