# Land Demarcation Tracker - Role-Based Architecture

## Overview

The Land Demarcation Tracker has been refactored to implement a clear role-based separation between different types of users: Citizens, Officers/ADC, and Administrators. This document outlines the architecture and key components of this role-based implementation.

## Directory Structure

The project follows a role-based directory structure for both backend and frontend:

### Backend Structure

```
server/
├── controllers/
│   ├── admin/           # Admin-specific controllers
│   ├── citizen/         # Citizen-specific controllers
│   ├── officer/         # Officer-specific controllers
│   └── shared/          # Shared controllers used across roles
├── middleware/
│   ├── admin/           # Admin-specific middleware
│   ├── citizen/         # Citizen-specific middleware
│   ├── officer/         # Officer-specific middleware
│   └── shared/          # Shared middleware used across roles
└── routes/
    ├── admin/           # Admin-specific routes
    ├── citizen/         # Citizen-specific routes
    ├── officer/         # Officer-specific routes
    └── shared/          # Shared routes used across roles
```

### Frontend Structure

```
client/src/
├── pages/
│   ├── admin/           # Admin-specific pages
│   ├── citizen/         # Citizen-specific pages
│   ├── officer/         # Officer-specific pages
│   └── shared/          # Shared pages used across roles
└── components/
    ├── admin/           # Admin-specific components
    ├── citizen/         # Citizen-specific components
    ├── officer/         # Officer-specific components
    └── shared/          # Shared components used across roles
```

## Role-Based Authentication

The application implements a robust role-based authentication system with the following key components:

1. **User Roles**: The system supports multiple user roles:
   - `citizen`: Regular citizens applying for land demarcation
   - `officer`: Revenue officers processing applications
   - `adc`: Additional District Collector with higher privileges
   - `admin`: System administrators with full access

2. **Authentication Middleware**:
   - Located in `server/middleware/shared/authMiddleware.ts`
   - Provides role-specific access control with middleware functions:
     - `isAuthenticated`: Basic session authentication
     - `isAdmin`: Checks for admin role
     - `isOfficerOrADC`: Checks for officer or ADC role
     - `isCitizen`: Checks for citizen role
     - `hasRole`: Generic role checking middleware

3. **Role-Specific Controllers**:
   - Each role has dedicated controllers handling its specific business logic
   - Common functionality is extracted to shared controllers
   - Example: `server/controllers/citizen/citizenController.ts` for citizen-specific operations

## API Routes

The API follows a role-based structure for routes:

1. **Citizen Routes** (`/api/citizen/`):
   - Public: signup, login, logout
   - Protected: profile management, application submission, status checks

2. **Officer Routes** (`/api/officer/`):
   - Public: login (with invite code), logout
   - Protected: profile management, application processing, plot management

3. **Admin Routes** (`/api/admin/`):
   - All routes require admin authentication
   - Dashboard statistics, user management, reporting

4. **Shared Routes**:
   - Document management, file uploads, etc.

## Frontend Role-Based Implementation

1. **Role-Based Routing**:
   - Different dashboards and interfaces based on user role
   - Role-specific navigation and functionality

2. **Role-Based Components**:
   - Dedicated components for each user role
   - Shared components for common functionality

## Development Guidelines

When extending the application, follow these guidelines:

1. **Add Role-Specific Features**:
   - Place new code in the appropriate role-specific directory
   - Reuse shared code where possible

2. **Authentication**:
   - Always use the appropriate middleware for role checking
   - For new roles, add dedicated middleware and update the shared authentication middleware

3. **API Development**:
   - Follow the existing role-based route structure
   - Place new endpoints in the appropriate role-specific route file

4. **Frontend Development**:
   - Place new pages and components in the appropriate role-specific directory
   - Use role-based conditional rendering for UI elements

## Database Access

The application uses a shared database schema with role-based access control:

1. **Schema**: Defined in `/shared/schema.ts` with Drizzle ORM
2. **Access Control**: Implemented at the API level through role-specific middleware
3. **Data Isolation**: Each role can only access data appropriate to their role through the API

## Testing

When testing the application, verify that:

1. Role-based access control works as expected
2. Users can only access features appropriate to their role
3. Shared functionality works correctly across all roles
