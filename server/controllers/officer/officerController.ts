import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import sharedUserController from '../shared/userController';

// Need to store passwords separately since they're not in the schema
const userPasswords = new Map<string, string>();

// Valid invite codes for officers (in production, this would be in a database)
const VALID_INVITE_CODES = new Set(['OFFICER123', 'ADC456']);

// Types for request bodies
interface OfficerSignupRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  inviteCode: string; // Required for officers
  circle?: string;    // Optional for officers
  designation?: string; // Optional for officers
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
  circle?: string;
  designation?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Officer controller with auth and profile methods
export const officerController = {
  // Register a new officer
  signup(req: Request, res: Response) {
    try {
      const { 
        username, 
        email, 
        password, 
        name,
        inviteCode,
        circle,
        designation
      } = req.body as OfficerSignupRequest;
      
      if (!username || !email || !password || !name || !inviteCode) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for officer signup' 
        });
      }

      // Validate invite code
      if (!VALID_INVITE_CODES.has(inviteCode)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid invite code'
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

          // Validate password complexity
          const passwordValidation = sharedUserController.validatePassword(password);
          if (!passwordValidation.valid) {
            return res.status(400).json({
              success: false,
              message: passwordValidation.message
            });
          }
          
          // Hash the password using shared controller
          const hashedPassword = await sharedUserController.hashPassword(password);
          
          const userId = uuidv4();
          
          // Store password in map (in production this would be in a secure database)
          userPasswords.set(userId, hashedPassword);
          
          // Determine role based on invite code
          const role = inviteCode === 'ADC456' ? 'adc' : 'officer';
          
          // Create new user as officer
          const newUser = {
            id: userId,
            username,
            email,
            name,
            role,
            circle,
            designation,
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
                req.session.userRole = role;
              }
              
              // Don't return password in response
              const { password, ...userWithoutPassword } = newUser;
              
              return res.status(201).json({
                success: true,
                message: 'Officer registered successfully',
                user: userWithoutPassword
              });
            })
            .catch(error => {
              console.error('Error inserting officer user:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Failed to register officer' 
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
      console.error('Error in officer signup:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration' 
      });
    }
  },

  // Login officer
  login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequest;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }
      
      // Check if user exists and is an officer or ADC
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
          
          // Check if user is an officer or ADC
          if (user.role !== 'officer' && user.role !== 'adc') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not an officer account' 
            });
          }
          
          // Check if user is active
          if (!user.active) {
            return res.status(403).json({ 
              success: false, 
              message: 'Account is inactive. Please contact admin.' 
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
          
          // Verify password using shared controller
          const isPasswordValid = await sharedUserController.verifyPassword(password, storedPassword);
          
          if (!isPasswordValid) {
            return res.status(401).json({ 
              success: false, 
              message: 'Invalid credentials' 
            });
          }
          
          // Set up session
          if (req.session) {
            req.session.userId = user.id;
            req.session.userRole = user.role;
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
      console.error('Error in officer login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
  },

  // Get current officer profile
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
          
          // Check if user is an officer or ADC
          if (user.role !== 'officer' && user.role !== 'adc') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not an officer account' 
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
          console.error('Error fetching officer profile:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error fetching profile' 
          });
        });
    } catch (error) {
      console.error('Error in getCurrentUser for officer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error fetching profile' 
      });
    }
  },

  // Update officer profile
  updateProfile(req: Request, res: Response) {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }
      
      const { name, circle, designation } = req.body as UpdateProfileRequest;
      
      // Verify user exists and is an officer
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
          
          // Check if user is an officer or ADC
          if (user.role !== 'officer' && user.role !== 'adc') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not an officer account' 
            });
          }
          
          // Update profile
          const updates: any = { updatedAt: new Date() };
          if (name) updates.name = name;
          if (circle) updates.circle = circle;
          if (designation) updates.designation = designation;
          
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
              console.error('Error updating officer profile:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Server error updating profile' 
              });
            });
        })
        .catch(error => {
          console.error('Error verifying officer for profile update:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error updating profile' 
          });
        });
    } catch (error) {
      console.error('Error in updateProfile for officer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error updating profile' 
      });
    }
  },

  // Change officer password
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
      
      // Check if user exists and is an officer
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
          
          // Check if user is an officer or ADC
          if (user.role !== 'officer' && user.role !== 'adc') {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: not an officer account' 
            });
          }
          
          // Verify current password using shared controller
          const isPasswordValid = await sharedUserController.verifyPassword(currentPassword, storedPassword);
          
          if (!isPasswordValid) {
            return res.status(401).json({ 
              success: false, 
              message: 'Current password is incorrect' 
            });
          }
          
          // Validate new password complexity
          const passwordValidation = sharedUserController.validatePassword(newPassword);
          if (!passwordValidation.valid) {
            return res.status(400).json({
              success: false,
              message: passwordValidation.message
            });
          }
          
          // Hash the new password using shared controller
          const hashedPassword = await sharedUserController.hashPassword(newPassword);
          
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
              console.error('Error updating officer record after password change:', error);
              res.status(500).json({ 
                success: false, 
                message: 'Server error changing password' 
              });
            });
        })
        .catch(error => {
          console.error('Error verifying officer for password change:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error changing password' 
          });
        });
    } catch (error) {
      console.error('Error in changePassword for officer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error changing password' 
      });
    }
  },

  // Logout officer - use shared controller
  logout(req: Request, res: Response) {
    return sharedUserController.logout(req, res);
  },
  
  // Get list of all officers (for admin dashboard)
  getAllOfficers(req: Request, res: Response) {
    try {
      // Query for all officers and ADCs
      db.select()
        .from(users)
        .where(sql`(${users.role} = 'officer' OR ${users.role} = 'adc')`)
        .then((result) => {
          // Remove passwords from results
          const officersWithoutPasswords = result.map(officer => {
            const { password, ...officerWithoutPassword } = officer;
            return officerWithoutPassword;
          });
          
          return res.status(200).json({
            success: true,
            officers: officersWithoutPasswords
          });
        })
        .catch(error => {
          console.error('Error fetching officers:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Server error fetching officers' 
          });
        });
    } catch (error) {
      console.error('Error in getAllOfficers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error fetching officers' 
      });
    }
  }
};
