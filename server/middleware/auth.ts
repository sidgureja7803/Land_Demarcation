import { NextFunction, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Middleware to check if the user is authenticated
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is logged in via session
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
  }

  // Store user ID and role in request object for easy access
  req.session.userId = req.session.userId;
  req.session.userRole = req.session.userRole || 'citizen';
  
  next();
};

// Middleware to check user role
export const checkRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
    }

    try {
      // Get user from database to check role
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      if (!userResult.length) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userResult[0];
      
      // Check if user role is allowed
      if (!allowedRoles.includes(user.role || 'citizen')) {
        return res.status(403).json({ 
          error: 'Forbidden: You do not have permission to perform this action',
          requiredRoles: allowedRoles,
          userRole: user.role
        });
      }

      // Store role in session for future use
      req.session.userRole = user.role;
      
      next();
    } catch (error) {
      console.error('Error checking user role:', error);
      return res.status(500).json({ error: 'Server error while checking permissions' });
    }
  };
};

// Middleware to check if user owns a resource
export const checkOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
    }

    try {
      // Get user from database
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      if (!userResult.length) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userResult[0];
      
      // If user is admin or officer, they can access any resource
      if (user.role === 'admin' || user.role === 'officer') {
        next();
        return;
      }

      // For citizens, check ownership based on resource type
      const resourceId = req.params.id;
      let isOwner = false;

      switch (resourceType) {
        case 'plot':
          // Implementation for checking plot ownership
          // This would look up the plot in the database and check if ownerId matches
          break;
        case 'document':
          // Implementation for checking document ownership
          // This would look up the document in the database and check if uploadedById matches
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden: You do not own this resource' });
      }

      next();
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return res.status(500).json({ error: 'Server error while checking ownership' });
    }
  };
};
