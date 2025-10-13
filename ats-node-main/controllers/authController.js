import prisma from '../prismaClient.js';
import sendOtpEmail, { sendUserCreateEmail, sendUserUpdateEmail, sendUserDeleteEmail, sendUserTypeChangeEmail, isEmailServiceAvailable } from "../utils/mailer.js";
import { generateOtp, storeOtp, validateOtp } from "../middlewares/validateOtp.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Configure multer for logo upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const companyName = req.body.name || 'default';
        const uploadPath = path.join('uploads', 'company', companyName);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Save as appit.png or appit.jpg
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `appit${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Only allow PNG and JPG files
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(new Error('Only PNG and JPG files are allowed!'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const sendOtp = async(req, res) => {
    try {
        const { email } = req.body;

        // Check if email service is available
        if (!isEmailServiceAvailable()) {
            return res.status(503).json({
                error: "Email service is currently unavailable. Please contact support or try again later.",
                details: "Email configuration is missing or invalid. Please check server configuration."
            });
        }

        // Check if user exists in ats_User table
        const user = await prisma.ats_User.findUnique({ where: { email } });

        // Check if superadmin exists in superadmins table
        const superadmin = await prisma.superadmin.findUnique({ where: { email } });

        // If neither user nor superadmin found
        if (!user && !superadmin) {
            return res.status(404).json({ error: "User not found" });
        }

        const otp = generateOtp();
        storeOtp(email, otp);

        try {
            await sendOtpEmail(email, otp);
            res.json({ message: "OTP sent successfully" });
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            res.status(500).json({
                error: "Failed to send OTP email",
                details: emailError.message,
                suggestion: "Please check your email address and try again, or contact support if the issue persists."
            });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyOtp = async(req, res) => {
    const { email, otp } = req.body;

    const result = validateOtp(email, otp);
    if (!result.valid) return res.status(400).json({ error: result.message });

    const user = await prisma.ats_User.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            number: true,
            userType: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    userCount: true
                }
            }
        },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Add login history entry
    await prisma.ats_Login.create({
        data: {
            userId: user.id,
            companyId: user.companyId,
        },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'ats-super-secure-jwt-secret-2024-production-ready';
    const token = jwt.sign({
            userId: user.id,
            email: user.email,
            companyId: user.companyId
        },
        jwtSecret, { expiresIn: '24h' }
    );

    res.json({
        message: "OTP verified & login history saved",
        token: token,
        user: {
            ...user,
            companyName: user.company ? user.company.name : null,
            companyInfo: user.company
        },
    });
};

// Simple Superadmin registration
export const registerSuperadmin = async(req, res) => {
    const { name, email } = req.body;

    try {
        // Check if superadmin already exists
        const existingSuperadmin = await prisma.superadmin.findUnique({ where: { email } });
        if (existingSuperadmin) {
            return res.status(400).json({ error: "Superadmin already exists" });
        }

        // Create superadmin
        const superadmin = await prisma.superadmin.create({
            data: { name, email }
        });

        res.json({
            message: "Superadmin created successfully",
            superadmin: {
                id: superadmin.id,
                name: superadmin.name,
                email: superadmin.email,
                userType: superadmin.userType
            }
        });

    } catch (error) {
        console.error('Superadmin creation error:', error);
        res.status(500).json({ error: "Superadmin creation failed" });
    }
};

// Superadmin login with OTP
export const superadminLogin = async(req, res) => {
    const { email, otp } = req.body;

    try {
        // Check if superadmin exists
        const superadmin = await prisma.superadmin.findUnique({ where: { email } });
        if (!superadmin) {
            return res.status(404).json({ error: "Superadmin not found" });
        }

        // Verify OTP (using same OTP system)
        const result = validateOtp(email, otp);
        if (!result.valid) {
            return res.status(400).json({ error: result.message });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'ats-super-secure-jwt-secret-2024-production-ready';
        const token = jwt.sign({ superadminId: superadmin.id, email: superadmin.email },
            jwtSecret, { expiresIn: '24h' }
        );

        res.json({
            message: "Superadmin login successful",
            token,
            superadmin: {
                id: superadmin.id,
                name: superadmin.name,
                email: superadmin.email,
                userType: superadmin.userType
            }
        });

    } catch (error) {
        console.error('Superadmin login error:', error);
        res.status(500).json({ error: "Superadmin login failed" });
    }
};

// Validate superadmin token
export const validateSuperadminToken = async(req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: "Access denied. No token provided."
            });
        }

        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'ats-super-secure-jwt-secret-2024-production-ready';
        const decoded = jwt.verify(token, jwtSecret);

        // Get superadmin from database
        const superadmin = await prisma.superadmin.findUnique({
            where: { id: decoded.superadminId },
            select: { id: true, name: true, email: true, userType: true }
        });

        if (!superadmin) {
            return res.status(401).json({
                success: false,
                error: "Invalid token. Superadmin not found."
            });
        }

        res.json({
            success: true,
            superadmin: {
                id: superadmin.id,
                name: superadmin.name,
                email: superadmin.email,
                userType: superadmin.userType
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        return res.status(401).json({
            success: false,
            error: "Invalid token."
        });
    }
};

export const createUser = async(req, res) => {
    const { name, email, number, userType = 'USER', companyName } = req.body;
    console.log("Creating user:", { name, email, number, userType, companyName });

    try {
        // Find company
        let company = await prisma.company.findFirst({
            where: { name: companyName }
        });

        if (!company) {
            return res.status(400).json({
                error: "Company not found. Please create company first.",
                companyName: companyName
            });
        }

        // Get current user count for company
        const currentUserCount = await prisma.ats_User.count({
            where: { companyId: company.id }
        });

        // Check if company has user limit and if it's reached
        if (company.userCount > 0 && currentUserCount >= company.userCount) {
            return res.status(400).json({
                error: `User limit reached for ${company.name}. Maximum users allowed: ${company.userCount}. Current users: ${currentUserCount}. Please contact admin to increase user limit.`,
                companyName: company.name,
                maxUsers: company.userCount,
                currentUsers: currentUserCount
            });
        }

        const user = await prisma.ats_User.create({
            data: {
                name,
                email,
                number,
                userType: userType.toUpperCase(),
                companyId: company.id
            }
        });

        // Update company userCount
        await prisma.company.update({
            where: { id: company.id },
            data: { userCount: { increment: 1 } }
        });

        // Send welcome email
        try {
            await sendUserCreateEmail(email, user, {
                createdBy: req.body.createdBy || 'System',
                createdAt: new Date().toLocaleDateString(),
                companyName: company.name,
                companyLogo: company.logo
            });
        } catch (emailError) {
            console.error('Error sending user creation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            message: "User created successfully",
            user: {
                ...user,
                companyName: company.name
            },
            companyInfo: {
                id: company.id,
                name: company.name,
                userCount: currentUserCount + 1,
                maxUsers: company.userCount
            }
        });
    } catch (err) {
        console.error('User creation error:', err);
        res.status(500).json({ error: "User creation failed" });
    }
};

export const updateUser = async(req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email, number, userType } = req.body;

    try {
        // Get the current user data to check for changes
        const currentUser = await prisma.ats_User.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                number: true,
                userType: true,
                company: {
                    select: {
                        name: true,
                        logo: true
                    }
                }
            }
        });

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Prepare update data
        const updateData = {};
        const updatedFields = [];

        if (name && name !== currentUser.name) {
            updateData.name = name;
            updatedFields.push('Name');
        }
        if (email && email !== currentUser.email) {
            updateData.email = email;
            updatedFields.push('Email');
        }
        if (number && number !== currentUser.number) {
            updateData.number = number;
            updatedFields.push('Phone');
        }
        if (userType && userType.toUpperCase() !== currentUser.userType) {
            updateData.userType = userType.toUpperCase();
            updatedFields.push('User Type');
        }

        // Update user
        const updatedUser = await prisma.ats_User.update({
            where: { id: userId },
            data: updateData,
        });

        // Send email notifications if there are changes
        if (updatedFields.length > 0) {
            try {
                // Send update email to user
                await sendUserUpdateEmail(updatedUser.email, updatedUser, updatedFields, {
                    updatedBy: req.body.updatedBy || 'System',
                    updatedAt: new Date().toLocaleDateString(),
                    companyName: currentUser.company ? currentUser.company.name : null,
                    companyLogo: currentUser.company ? currentUser.company.logo : null
                });

                // Send special email for user type change
                if (userType && userType.toUpperCase() !== currentUser.userType) {
                    await sendUserTypeChangeEmail(updatedUser.email, updatedUser, currentUser.userType, userType.toUpperCase(), {
                        changedBy: req.body.updatedBy || 'System',
                        changedAt: new Date().toLocaleDateString()
                    });
                }
            } catch (emailError) {
                console.error('Error sending user update email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.json({
            message: "User updated successfully",
            user: updatedUser,
            updatedFields: updatedFields.length > 0 ? updatedFields : []
        });
    } catch (err) {
        console.error('User update error:', err);
        res.status(500).json({ error: "User update failed" });
    }
};

export const deleteUser = async(req, res) => {
    const userId = parseInt(req.params.id);

    try {
        // Get user data and company info before deletion for email notification
        const userToDelete = await prisma.ats_User.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                userType: true,
                companyId: true,
                company: {
                    select: {
                        name: true,
                        logo: true
                    }
                }
            }
        });

        if (!userToDelete) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete related login records first
        await prisma.ats_Login.deleteMany({ where: { userId } });

        // Get user's companyId for userCount update
        const userCompany = await prisma.ats_User.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });

        // Delete the user
        await prisma.ats_User.delete({ where: { id: userId } });

        // Update company userCount
        if (userCompany && userCompany.companyId) {
            await prisma.company.update({
                where: { id: userCompany.companyId },
                data: { userCount: { decrement: 1 } }
            });
        }

        // Send deletion email
        try {
            await sendUserDeleteEmail(userToDelete.email, userToDelete, {
                deletedBy: req.body.deletedBy || 'System',
                deletedAt: new Date().toLocaleDateString(),
                companyName: userToDelete.company ? userToDelete.company.name : null,
                companyLogo: userToDelete.company ? userToDelete.company.logo : null
            });
        } catch (emailError) {
            console.error('Error sending user deletion email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error('User deletion error:', err);
        res.status(500).json({ error: "User deletion failed" });
    }
};

export const getAllUsers = async(req, res) => {
    try {
        const { companyId } = req.query;

        const whereClause = companyId ? { companyId: parseInt(companyId) } : {};

        const users = await prisma.ats_User.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                number: true,
                userType: true,
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
        });

        // Get company user counts
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        res.json({
            users,
            companies: companies.map(company => ({
                id: company.id,
                name: company.name,
                userCount: company._count.users
            }))
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

export const getAllLoginHistory = async(req, res) => {
    try {
        const logins = await prisma.ats_Login.findMany({
            select: {
                id: true,
                loggedAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        userType: true,
                        company: {
                            select: {
                                id: true,
                                name: true,
                                logo: true
                            }
                        }
                    },
                },
            },
            orderBy: {
                loggedAt: "desc",
            },
        });

        res.json({ loginHistory: logins });
    } catch (err) {
        console.error('Error fetching login history:', err);
        res.status(500).json({ error: "Failed to fetch login history" });
    }
};

export const getUsersByType = async(req, res) => {
    const { userType } = req.params;

    try {
        const users = await prisma.ats_User.findMany({
            where: {
                userType: userType.toUpperCase()
            },
            select: {
                id: true,
                name: true,
                email: true,
                number: true,
                userType: true,
            },
        });

        res.json({
            users,
            count: users.length,
            userType: userType.toUpperCase()
        });
    } catch (err) {
        console.error('Error fetching users by type:', err);
        res.status(500).json({ error: "Failed to fetch users by type" });
    }
};

export const getUserById = async(req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const user = await prisma.ats_User.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                number: true,
                userType: true,
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                logins: {
                    select: {
                        id: true,
                        loggedAt: true,
                    },
                    orderBy: {
                        loggedAt: "desc",
                    },
                    take: 10, // Get last 10 logins
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

// New function to get all companies with user counts
export const getAllCompanies = async(req, res) => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                logo: true,
                userCount: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            companies: companies.map(company => ({
                id: company.id,
                name: company.name,
                logo: company.logo,
                userLimit: company.userCount, // This is the limit
                currentUsers: company._count.users, // This is the current count
                createdAt: company.createdAt
            }))
        });
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: "Failed to fetch companies" });
    }
};

// Superadmin-only company management
export const createCompany = async(req, res) => {
    const { name, userCount } = req.body;

    try {
        // Get superadmin from authenticated request (set by middleware)
        const superadmin = req.superadmin;

        if (!superadmin) {
            return res.status(401).json({
                error: "Authentication required. Please login as superadmin."
            });
        }

        // Check if company already exists
        const existingCompany = await prisma.company.findFirst({
            where: { name }
        });

        if (existingCompany) {
            return res.status(400).json({ error: "Company already exists" });
        }

        // Handle logo upload
        let logoPath = null;
        if (req.file) {
            logoPath = path.join('uploads', 'company', name, req.file.filename);
        } else {
            // Set default logo if no logo is uploaded
            logoPath = 'public/default-company-logo.jpg';
        }

        // Parse userCount to integer, default to 0 if not provided
        const initialUserCount = userCount ? parseInt(userCount) : 0;

        const company = await prisma.company.create({
            data: {
                name,
                logo: logoPath,
                userCount: initialUserCount,
                superadminId: superadmin.id
            }
        });

        res.json({
            message: "Company created successfully",
            company: {
                id: company.id,
                name: company.name,
                logo: logoPath,
                userCount: company.userCount
            }
        });
    } catch (err) {
        console.error('Company creation error:', err);
        res.status(500).json({ error: "Company creation failed" });
    }
};

// Update company function
export const updateCompany = async(req, res) => {
    const { id } = req.params;
    const { name, userCount } = req.body;

    try {
        // Check if company exists
        const existingCompany = await prisma.company.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCompany) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Get current actual user count
        const currentActualUsers = await prisma.ats_User.count({
            where: { companyId: parseInt(id) }
        });

        // Parse userCount to integer, default to existing value if not provided
        const newUserCount = userCount ? parseInt(userCount) : existingCompany.userCount;

        // Validate that new user count is not less than current actual users
        if (newUserCount > 0 && newUserCount < currentActualUsers) {
            return res.status(400).json({
                error: `Cannot set user limit to ${newUserCount}. Company currently has ${currentActualUsers} users. Please remove users first or set a higher limit.`,
                currentUsers: currentActualUsers,
                requestedLimit: newUserCount
            });
        }

        // Handle logo upload
        let logoPath = existingCompany.logo; // Keep existing logo if no new one uploaded
        if (req.file) {
            // Delete old logo file if exists
            if (existingCompany.logo && fs.existsSync(existingCompany.logo)) {
                fs.unlinkSync(existingCompany.logo);
            }

            // Create new folder with new company name
            const newUploadPath = path.join('uploads', 'company', name);
            if (!fs.existsSync(newUploadPath)) {
                fs.mkdirSync(newUploadPath, { recursive: true });
            }

            logoPath = path.join('uploads', 'company', name, req.file.filename);
        } else if (!existingCompany.logo) {
            // Set default logo if company has no logo
            logoPath = 'public/default-company-logo.jpg';
        }

        const company = await prisma.company.update({
            where: { id: parseInt(id) },
            data: {
                name,
                logo: logoPath,
                userCount: newUserCount
            }
        });

        res.json({
            message: "Company updated successfully",
            company: {
                id: company.id,
                name: company.name,
                logo: logoPath,
                userCount: company.userCount,
                currentUsers: currentActualUsers
            }
        });
    } catch (err) {
        console.error('Company update error:', err);
        res.status(500).json({ error: "Company update failed" });
    }
};

// Delete company function
export const deleteCompany = async(req, res) => {
    const { id } = req.params;

    try {
        console.log('Delete company request:', { id, superadmin: req.superadmin });

        // Check if company exists
        const existingCompany = await prisma.company.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCompany) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Check if company has users
        const userCount = await prisma.ats_User.count({
            where: { companyId: parseInt(id) }
        });

        console.log('Company user count:', userCount);

        if (userCount > 0) {
            return res.status(400).json({
                error: "Cannot delete company with existing users",
                userCount: userCount
            });
        }

        // Delete logo file if exists
        if (existingCompany.logo && fs.existsSync(existingCompany.logo)) {
            fs.unlinkSync(existingCompany.logo);
        }

        // Delete company folder
        const companyFolder = path.join('uploads', 'company', existingCompany.name);
        if (fs.existsSync(companyFolder)) {
            fs.rmSync(companyFolder, { recursive: true, force: true });
        }

        // Delete company from database
        await prisma.company.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            message: "Company deleted successfully",
            deletedCompany: {
                id: existingCompany.id,
                name: existingCompany.name
            }
        });
    } catch (err) {
        console.error('Company deletion error:', err);
        res.status(500).json({ error: "Company deletion failed" });
    }
};

// Get company by ID
export const getCompanyById = async(req, res) => {
    const { id } = req.params;

    try {
        const company = await prisma.company.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                logo: true,
                userCount: true,
                createdAt: true
            }
        });

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json({
            company: {
                id: company.id,
                name: company.name,
                logo: company.logo,
                userCount: company.userCount,
                createdAt: company.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching company:', err);
        res.status(500).json({ error: "Failed to fetch company" });
    }
};

// Utility function to set default logos for companies without logos
export const setDefaultLogosForCompanies = async(req, res) => {
    try {
        // Find all companies without logos
        const companiesWithoutLogos = await prisma.company.findMany({
            where: {
                OR: [
                    { logo: null },
                    { logo: '' }
                ]
            }
        });

        console.log(`Found ${companiesWithoutLogos.length} companies without logos`);

        // Update each company with default logo
        const updatePromises = companiesWithoutLogos.map(company =>
            prisma.company.update({
                where: { id: company.id },
                data: { logo: 'public/default-company-logo.jpg' }
            })
        );

        await Promise.all(updatePromises);

        res.json({
            message: `Updated ${companiesWithoutLogos.length} companies with default logos`,
            updatedCount: companiesWithoutLogos.length
        });
    } catch (err) {
        console.error('Error setting default logos:', err);
        res.status(500).json({ error: "Failed to set default logos" });
    }
};