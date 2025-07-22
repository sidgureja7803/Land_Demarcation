import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Middleware to check if user is a citizen
export const isCitizen = async (req: Request, res: Response, next: NextFunction) => {
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
    
    if (user.role !== 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not a citizen'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in citizen middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

export default { isCitizen };
