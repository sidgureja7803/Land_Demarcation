import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Need to store passwords separately since they're not in the schema
const userPasswords = new Map<string, string>();

// Add userId and role to session
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

// Shared user controller with common authentication methods
export const sharedUserController = {
  // Logout user - common functionality for all roles
  logout(req: Request, res: Response) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error during logout:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to logout'
          });
        }
        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  },

  // Shared method to get user by ID - used internally
  async getUserById(userId: string) {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.id, userId));
        
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Shared method for password hashing - used internally
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  // Shared method for password verification - used internally
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Shared method to validate password complexity - used internally
  validatePassword(password: string): { valid: boolean, message: string } {
    // Password should be at least 8 characters
    if (password.length < 8) {
      return { 
        valid: false, 
        message: 'Password must be at least 8 characters long' 
      };
    }
    
    // Password should contain at least one number
    if (!/\d/.test(password)) {
      return { 
        valid: false, 
        message: 'Password must contain at least one number' 
      };
    }
    
    // Password should contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { 
        valid: false, 
        message: 'Password must contain at least one uppercase letter' 
      };
    }
    
    // Password should contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { 
        valid: false, 
        message: 'Password must contain at least one special character' 
      };
    }
    
    return { valid: true, message: 'Password is valid' };
  }
};

// Export for use in role-specific controllers
export default sharedUserController;
