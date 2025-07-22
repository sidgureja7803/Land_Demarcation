import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Middleware to check if user is an officer or ADC
export const isOfficerOrADC = async (req: Request, res: Response, next: NextFunction) => {
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
    
    if (user.role !== 'officer' && user.role !== 'adc') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not an officer or ADC'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in officer/ADC middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

// Middleware to check if user is an ADC specifically
export const isADC = async (req: Request, res: Response, next: NextFunction) => {
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
    
    if (user.role !== 'adc') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not an ADC'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in ADC middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

export default { isOfficerOrADC, isADC };
