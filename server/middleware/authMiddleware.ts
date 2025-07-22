import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Middleware to check if user is authenticated
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

// Middleware to check if user is an admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
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
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not an admin'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

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

// Middleware to check if user is a specific role
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
