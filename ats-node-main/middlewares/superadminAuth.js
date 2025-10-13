// ✅ middlewares/superadminAuth.js
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

export const superadminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Access denied. No token provided." 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'ats-super-secure-jwt-secret-2024-production-ready';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get superadmin from database
    const superadmin = await prisma.superadmin.findUnique({
      where: { id: decoded.superadminId },
      select: { id: true, name: true, email: true, userType: true }
    });

    if (!superadmin) {
      return res.status(401).json({ 
        error: "Invalid token. Superadmin not found." 
      });
    }

    // Add superadmin to request
    req.superadmin = superadmin;
    next();

  } catch (error) {
    console.error('Superadmin auth error:', error);
    return res.status(401).json({ 
      error: "Invalid token." 
    });
  }
};
