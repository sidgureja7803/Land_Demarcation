import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Import role-specific middlewares
import adminMiddleware from '../admin/adminMiddleware';
import citizenMiddleware from '../citizen/citizenMiddleware';
import officerMiddleware from '../officer/officerMiddleware';

// Basic authentication middleware - checks if user is logged in
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  next();
};

// Generic role checking middleware
export const hasRole = (role: string) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const result = await db.select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = result[0];
    
    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied: required role '${role}' not assigned to user`
      });
    }
    
    next();
  } catch (error) {
    console.error(`Error in role '${role}' middleware:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

// Re-export role-specific middlewares for convenience
export const { isAdmin } = adminMiddleware;
export const { isCitizen } = citizenMiddleware;
export const { isOfficerOrADC, isADC } = officerMiddleware;

// Export default object with all middlewares
export default {
  isAuthenticated,
  hasRole,
  isAdmin,
  isCitizen,
  isOfficerOrADC,
  isADC
};
