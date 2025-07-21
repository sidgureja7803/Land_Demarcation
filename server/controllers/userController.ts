import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Need to store passwords separately since they're not in the schema
const userPasswords = new Map<string, string>();

// Types for request bodies
interface SignupRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  inviteCode?: string; // For officers/ADC
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User controller with auth methods
export const userController = {
  // Register a new user
  signup: async (req: Request, res: Response) => {
    try {
      const { 
        username, 
        email, 
        password, 
        name, 
        role = 'citizen', 
        aadhaarNumber,
        phoneNumber,
        address,
        inviteCode 
      } = req.body as SignupRequest;

      // Basic validation
      if (!username || !email || !password || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['username', 'email', 'password', 'name'] 
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Password strength validation (minimum 8 characters with at least one number and one letter)
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long and contain at least one letter and one number' 
        });
      }

      // Check for existing user with same email or username
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .or(eq(users.username, username))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ 
          error: 'User already exists with this email or username' 
        });
      }

      // Role validation - citizens can sign up freely, officers need an invite code
      if (role !== 'citizen') {
        // In a real implementation, you would validate the invite code against a predefined
        // list or a database table of valid invite codes for officers
        const validInviteCodes = process.env.OFFICER_INVITE_CODES 
          ? process.env.OFFICER_INVITE_CODES.split(',')
          : ['OFFICER123', 'ADC456']; // Default codes for testing
        
        if (!inviteCode || !validInviteCodes.includes(inviteCode)) {
          return res.status(403).json({
            error: 'Invalid invite code for officer registration'
          });
        }
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate user ID
      const userId = uuidv4();

      // Create user
      const newUser = await db.insert(users).values({
        id: userId, 
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        role: role || 'citizen',
        employeeId: role !== 'citizen' ? username : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt
      });
      
      // Store password hash in memory map
      userPasswords.set(userId, hashedPassword);

      // Success response - do not include password or sensitive data
      return res.status(201).json({
        message: 'User created successfully',
        user: newUser[0]
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Login user
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as LoginRequest;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['email', 'password'] 
        });
      }

      // Find user by email
      const userResult = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userResult.length) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      const user = userResult[0];

      // Check if user account is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Account is inactive or suspended'
        });
      }

      // Get password hash from in-memory storage
      const storedHash = userPasswords.get(user.id);
      
      // For demo/development purposes, allow a default password if no hash is stored
      // This helps with testing or when the server restarts and in-memory passwords are lost
      const defaultPasswordHash = '$2b$10$6LKBj.cBUQ.DlT4DX3QQjuoqaBn8v8tTNbOvwkU1IhTBpTJw9jm6i'; // hash for 'password123'
      
      // Verify password against stored hash or fallback to default for testing
      const isPasswordValid = storedHash ? 
        await bcrypt.compare(password, storedHash) : 
        await bcrypt.compare(password, defaultPasswordHash);
        
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Set user session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;

      // Success response - do not include password hash or sensitive data
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Logout user
  logout: (req: Request, res: Response) => {
    if (req.session) {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            error: 'Logout failed',
            details: err.message
          });
        }
        
        // Clear the cookie
        res.clearCookie('connect.sid');
        
        return res.status(200).json({
          message: 'Logged out successfully'
        });
      });
    } else {
      return res.status(200).json({
        message: 'Already logged out'
      });
    }
  },

  // Get current user profile
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
      console.error('Change password error:', error);
      return res.status(500).json({
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Admin only: Get all users
  getAllUsers: async (req: Request, res: Response) => {
    try {
      // This endpoint should be protected with role-based access control middleware
      
      // Get users with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const usersList = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
        .from(users)
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      const countResult = await db.select({ count: db.fn.count(users.id) }).from(users);
      const totalUsers = Number(countResult[0].count);
      
      // Return users list with pagination metadata
      return res.status(200).json({
        users: usersList,
        pagination: {
          total: totalUsers,
          page,
          limit,
          pages: Math.ceil(totalUsers / limit)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Admin only: Toggle user active status
  toggleUserStatus: async (req: Request, res: Response) => {
    try {
      // This endpoint should be protected with role-based access control middleware
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Check if user exists
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
      if (!userResult.length) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult[0];
      
      // Toggle active status
      await db.update(users)
        .set({
          isActive: !user.isActive,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return res.status(200).json({
        message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
        userId,
        isActive: !user.isActive
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      return res.status(500).json({
        error: 'Failed to update user status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
