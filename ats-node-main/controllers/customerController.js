import { PrismaClient } from '@prisma/client';
import { sendCustomerCreateEmail, sendCustomerUpdateEmail, sendCustomerDeleteEmail } from '../utils/mailer.js';
const prisma = new PrismaClient();

// Customer Controller with only 4 basic APIs
const customerController = {
  // Get all customers
  getAllCustomers: async (req, res) => {
    try {
      // Get company ID from auth middleware
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(403).json({
          error: "Company context required. Please ensure you are logged in with a valid company account."
        });
      }

      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        priority, 
        industry,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build where clause with company filtering
      const where = {
        companyId: companyId  // Always filter by company
      };
      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (industry) where.industry = industry;

      // Get customers
      const customers = await prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      });

      // Get total count for pagination
      const total = await prisma.customer.count({ where });
      const totalPages = Math.ceil(total / limit);

      console.log(`Fetched ${customers.length} customers, total: ${total}`);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  },

  // Create new customer (internal/external)
  createCustomer: async (req, res) => {
    try {
      // Get company ID from auth middleware
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          error: "Company context required. Please ensure you are logged in with a valid company account."
        });
      }

      const {
        companyName,
        industry,
        companySize,
        website,
        description,
        status,
        priority,
        country,
        city,
        address,
        annualRevenue,
        contractValue,
        billingCycle,
        email
      } = req.body;

      console.log('Creating customer with data:', { companyName, industry, country, city, email, companyId });

      // Validate required fields
      if (!companyName || !industry || !country || !city) {
        return res.status(400).json({
          success: false,
          message: 'Company name, industry, country, and city are required'
        });
      }

      const customer = await prisma.customer.create({
        data: {
          companyId: companyId,  // ✅ Add company isolation
          companyName,
          industry,
          companySize,
          website,
          description,
          status: status || 'ACTIVE',
          priority: priority || 'MEDIUM',
          country,
          city,
          address,
          annualRevenue,
          contractValue: contractValue ? parseFloat(contractValue) : null,
          billingCycle,
          email
        }
      });

      console.log('Customer created successfully:', customer.id);

      // Send welcome email if email is provided
      if (email) {
        try {
          console.log('Sending welcome email to:', email);
          await sendCustomerCreateEmail(email, customer, {
            createdAt: customer.createdAt
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Error sending customer creation email:', emailError);
          // Don't fail the request if email fails
        }
      } else {
        console.log('No email provided, skipping welcome email');
      }

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('Updating customer:', id, 'with data:', updateData);

      // Get the customer before update to compare changes
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const customer = await prisma.customer.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      // Determine which fields were updated
      const updatedFields = [];
      Object.keys(updateData).forEach(key => {
        if (existingCustomer[key] !== customer[key]) {
          updatedFields.push(key);
        }
      });

      console.log('Customer updated successfully, fields changed:', updatedFields);

      // Send update email if email is provided
      if (customer.email) {
        try {
          console.log('Sending update email to:', customer.email);
          await sendCustomerUpdateEmail(customer.email, customer, updatedFields, {
            updatedAt: customer.updatedAt
          });
          console.log('Update email sent successfully');
        } catch (emailError) {
          console.error('Error sending customer update email:', emailError);
          // Don't fail the request if email fails
        }
      } else {
        console.log('No email found for customer, skipping update email');
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer',
        error: error.message
      });
    }
  },

  // Delete customer
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('Deleting customer:', id);

      // Get the customer before deletion to send email
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      await prisma.customer.delete({
        where: { id: parseInt(id) }
      });

      console.log('Customer deleted successfully');

      // Send deletion email if email is provided
      if (customer.email) {
        try {
          console.log('Sending deletion email to:', customer.email);
          await sendCustomerDeleteEmail(customer.email, customer, {
            deletedAt: new Date()
          });
          console.log('Deletion email sent successfully');
        } catch (emailError) {
          console.error('Error sending customer deletion email:', emailError);
          // Don't fail the request if email fails
        }
      } else {
        console.log('No email found for customer, skipping deletion email');
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
        error: error.message
      });
    }
  }
};

export { customerController }; 