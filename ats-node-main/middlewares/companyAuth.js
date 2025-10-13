// ✅ middlewares/companyAuth.js
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

export const companyAuth = async(req, res, next) => {
    try {
        // Define public routes that don't require authentication
        const publicRoutes = [
            '/api/auth/send-otp',
            '/api/auth/verify-otp',
            '/api/auth/register-superadmin',
            '/api/auth/superadmin-login'
        ];

        // Skip authentication for public routes
        if (publicRoutes.includes(req.path)) {
            return next();
        }

        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: "Access denied. No token provided.",
                code: "NO_TOKEN"
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const jwtSecret = process.env.JWT_SECRET || 'ats-super-secure-jwt-secret-2024-production-ready';
        let decoded;

        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: "Token has expired. Please login again.",
                    code: "TOKEN_EXPIRED"
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: "Invalid token format.",
                    code: "INVALID_TOKEN"
                });
            } else {
                throw jwtError;
            }
        }

        // Validate required token fields
        if (!decoded.userId || !decoded.companyId) {
            return res.status(401).json({
                success: false,
                error: "Invalid token payload. Missing required fields.",
                code: "INVALID_TOKEN_PAYLOAD"
            });
        }

        // Get user from database with company information
        console.log('🔍 Auth Middleware - Looking up user with ID:', decoded.userId);
        const user = await prisma.ats_User.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                userType: true,
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logo: true
                    }
                }
            }
        });
        console.log('🔍 Auth Middleware - User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid token. User not found.",
                code: "USER_NOT_FOUND"
            });
        }

        // Validate company ID matches token
        if (user.companyId !== decoded.companyId) {
            return res.status(403).json({
                success: false,
                error: "Token company ID mismatch. Please login again.",
                code: "COMPANY_ID_MISMATCH"
            });
        }

        // Add user and company context to request
        req.user = user;
        req.companyId = user.companyId;
        req.company = user.company;

        console.log('🔍 Auth Middleware - Setting company context:');
        console.log('Company ID:', req.companyId);
        console.log('User ID:', req.user.id);
        console.log('Request path:', req.path);
        console.log('Request method:', req.method);

        // Add company ID to query parameters if not already present
        if (!req.query.companyId && user.companyId) {
            req.query.companyId = user.companyId.toString();
        }

        next();

    } catch (error) {
        console.error('Company auth error:', error);
        return res.status(401).json({
            success: false,
            error: "Authentication failed. Please login again.",
            code: "AUTH_ERROR"
        });
    }
};

export const requireCompany = (req, res, next) => {
    if (!req.companyId) {
        return res.status(403).json({
            error: "Company context required. Please ensure you are logged in with a valid company account."
        });
    }
    next();
};