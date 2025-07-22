import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Need to store passwords separately since they're not in the schema
const userPasswords = new Map<string, string>();

// Types for request bodies
interface CitizenSignupRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  // Additional fields for the citizen profile
  aadhaarNumber?: string;
  phoneNumber?: string;
  address?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
  address?: string;
  aadhaarNumber?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Citizen controller with auth and profile methods
export const citizenController = {
  // Register a new citizen
  signup(req: Request, res: Response) {
    try {
      const { 
        username, 
        email, 
        password, 
        name, 
        aadhaarNumber,
        phoneNumber,
        address 
      } = req.body as CitizenSignupRequest;
      
      if (!username || !email || !password || !name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for signup' 
        });
      }

      // Check if user already exists
      db.select()
        .from(users)
        .where(eq(users.email, email))
        .then(async (existingUsers) => {
          if (existingUsers.length > 0) {
            return res.status(400).json({ 
              success: false, 
              message: 'User with this email already exists' 
            });
          }

          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          const userId = uuidv4();
          
          // Store password in map (in production this would be in a secure database)
          userPasswords.set(userId, hashedPassword);
          
          // Create new user with citizen role
          const newUser = {
            id: userId,
            username,
            email,
            name,
            role: 'citizen',
            aadhaarNumber,
            phoneNumber,
            address,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true
          };
          
          db.insert(users)
            .values(newUser)
            .then(() => {
              // Set up session
              if (req.session) {
                req.session.userId = userId;
                req.session.userRole = 'citizen';
              }
              
              // Don't return password in response
              const { password, ...userWithoutPassword } = newUser;
              
              return res.status(201).json({
                success: true,
                message: 'Citizen registered successfully',
                user: userWithoutPassword
              });
            })
            .catch(error => {
              console.error('Error inserting citizen user:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Failed to register citizen' 
              });
            });
        })
        .catch(error => {
          console.error('Error checking for existing user:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
          });
        });
    } catch (error) {
      console.error('Error in citizen signup:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration' 
      });
    }
  },

  // Login citizen
  login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequest;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }
      
      // Check if user exists and is a citizen
      db.select()
        .from(users)
        .where(eq(users.email, email))
        .then(async (result) => {
          if (result.length === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'User not found' 
            });
          }
          
          const user = result[0];
          
          // Check if user is a citizen
          if (user.role !== 'citizen') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not a citizen account' 
            });
          }
          
          // Check if user is active
          if (!user.active) {
            return res.status(403).json({ 
              success: false, 
              message: 'Account is inactive. Please contact support.' 
            });
          }
          
          // Get password from map
          const storedPassword = userPasswords.get(user.id);
          
          if (!storedPassword) {
            return res.status(500).json({ 
              success: false, 
              message: 'Authentication error' 
            });
          }
          
          // Compare password
          const isMatch = await bcrypt.compare(password, storedPassword);
          
          if (!isMatch) {
            return res.status(401).json({ 
              success: false, 
              message: 'Invalid credentials' 
            });
          }
          
          // Set up session
          if (req.session) {
            req.session.userId = user.id;
            req.session.userRole = 'citizen';
          }
          
          // Update last login time
          await db.update(users)
            .set({ lastLogin: new Date() })
            .where(eq(users.id, user.id));
          
          // Don't return password in response
          const { password, ...userWithoutPassword } = user;
          
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
          });
        })
        .catch(error => {
          console.error('Error during login query:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
          });
        });
    } catch (error) {
      console.error('Error in citizen login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
  },

  // Get current citizen profile
  getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }
      
      // Get user profile
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .then((result) => {
          if (result.length === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'User not found' 
            });
          }
          
          const user = result[0];
          
          // Check if user is a citizen
          if (user.role !== 'citizen') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not a citizen account' 
            });
          }
          
          // Don't return password
          const { password, ...userWithoutPassword } = user;
          
          return res.status(200).json({
            success: true,
            user: userWithoutPassword
          });
        })
        .catch(error => {
          console.error('Error fetching citizen profile:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error fetching profile' 
          });
        });
    } catch (error) {
      console.error('Error in getCurrentUser for citizen:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error fetching profile' 
      });
    }
  },

  // Update citizen profile
  updateProfile(req: Request, res: Response) {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }
      
      const { name, phoneNumber, address, aadhaarNumber } = req.body as UpdateProfileRequest;
      
      // Verify user exists and is a citizen
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .then((result) => {
          if (result.length === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'User not found' 
            });
          }
          
          const user = result[0];
          
          // Check if user is a citizen
          if (user.role !== 'citizen') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not a citizen account' 
            });
          }
          
          // Update profile
          const updates: any = { updatedAt: new Date() };
          if (name) updates.name = name;
          if (phoneNumber) updates.phoneNumber = phoneNumber;
          if (address) updates.address = address;
          if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;
          
          db.update(users)
            .set(updates)
            .where(eq(users.id, userId))
            .then(() => {
              return res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
              });
            })
            .catch(error => {
              console.error('Error updating citizen profile:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Server error updating profile' 
              });
            });
        })
        .catch(error => {
          console.error('Error verifying citizen for profile update:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error updating profile' 
          });
        });
    } catch (error) {
      console.error('Error in updateProfile for citizen:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error updating profile' 
      });
    }
  },

  // Change citizen password
  changePassword(req: Request, res: Response) {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }
      
      const { currentPassword, newPassword } = req.body as ChangePasswordRequest;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current and new passwords are required' 
        });
      }
      
      // Verify current password
      const storedPassword = userPasswords.get(userId);
      
      if (!storedPassword) {
        return res.status(500).json({ 
          success: false, 
          message: 'Authentication error' 
        });
      }
      
      // Check if user exists and is a citizen
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .then(async (result) => {
          if (result.length === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'User not found' 
            });
          }
          
          const user = result[0];
          
          // Check if user is a citizen
          if (user.role !== 'citizen') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not a citizen account' 
            });
          }
          
          // Verify current password
          const isMatch = await bcrypt.compare(currentPassword, storedPassword);
          
          if (!isMatch) {
            return res.status(401).json({ 
              success: false, 
              message: 'Current password is incorrect' 
            });
          }
          
          // Hash new password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          
          // Update password in map
          userPasswords.set(userId, hashedPassword);
          
          // Update user record
          db.update(users)
            .set({ updatedAt: new Date() })
            .where(eq(users.id, userId))
            .then(() => {
              return res.status(200).json({
                success: true,
                message: 'Password changed successfully'
              });
            })
            .catch(error => {
              console.error('Error updating citizen record after password change:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Server error changing password' 
              });
            });
        })
        .catch(error => {
          console.error('Error verifying citizen for password change:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error changing password' 
          });
        });
    } catch (error) {
      console.error('Error in changePassword for citizen:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error changing password' 
      });
    }
  },

  // Logout citizen
  logout(req: Request, res: Response) {
    try {
      req.session?.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error logging out' 
          });
        }
        
        res.clearCookie('connect.sid');
        
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } catch (error) {
      console.error('Error in citizen logout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during logout' 
      });
    }
  }
};
