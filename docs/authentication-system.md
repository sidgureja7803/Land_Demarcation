# Land Demarcation Tracker - Authentication System

## Overview

The Land Demarcation Tracker implements a comprehensive authentication system that supports different user roles with appropriate access levels. This document describes the authentication architecture, components, and best practices.

## User Roles

The system supports multiple user roles with different access privileges:

1. **Citizen**
   - Regular users applying for land demarcation services
   - Can submit applications, check status, and manage their profile
   - Identified by role `citizen` in the database

2. **Officer**
   - Revenue officers who process applications
   - Can review applications, update status, and manage assigned plots
   - Identified by role `officer` in the database

3. **ADC (Additional District Collector)**
   - Higher authority who makes final decisions on applications
   - Can approve/reject applications and oversee officer work
   - Identified by role `adc` in the database

4. **Administrator**
   - System administrators with full access
   - Can manage users, view reports, and configure system settings
   - Identified by role `admin` in the database

## Authentication Components

### 1. Session Management

The application uses Express sessions for authentication:

```typescript
// In server/index.ts
app.use(session({
  secret: process.env.SESSION_SECRET || 'land-demarcation-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### 2. Authentication Middleware

Located in `server/middleware/shared/authMiddleware.ts`, these middleware functions enforce role-based access:

- **isAuthenticated**: Checks if a user is logged in
- **isAdmin**: Verifies the user has admin role
- **isOfficerOrADC**: Checks if user is either an officer or ADC
- **isADC**: Verifies the user has ADC role
- **isCitizen**: Checks if user is a citizen
- **hasRole**: Generic role checking middleware

### 3. User Controllers

The authentication logic is implemented in role-specific controllers:

- **Citizen Controller** (`server/controllers/citizen/citizenController.ts`)
- **Officer Controller** (`server/controllers/officer/officerController.ts`)
- **Shared User Controller** (`server/controllers/shared/userController.ts`)

Each controller implements:
- User registration (signup)
- Authentication (login)
- Session termination (logout)
- Password management

### 4. Password Security

Passwords are securely managed using bcrypt:

```typescript
// Password hashing
const hashedPassword = await sharedUserController.hashPassword(password);

// Password verification
const isValid = await sharedUserController.verifyPassword(
  password, 
  userPassword
);
```

## Authentication Flow

### Registration (Signup)

1. User submits registration form with required details
2. Backend validates inputs (email format, password complexity)
3. For officers/ADC, invitation code is verified
4. Password is hashed using bcrypt
5. User record is created in the database
6. Success response is sent to client

### Login

1. User submits email and password
2. Backend looks up user by email
3. If user exists, password is verified using bcrypt
4. On successful verification:
   - Session is created with userId and userRole
   - User details are returned to client
5. On failure, error response is sent

### Access Control

1. Protected routes use appropriate role middleware
2. Middleware checks session for userId and role
3. If access is permitted, the request proceeds
4. If access is denied, 401 or 403 response is sent

## Frontend Integration

The frontend uses an authentication hook that:

1. Manages authentication state
2. Provides login/logout functions
3. Stores user details and role
4. Controls access to role-specific components and routes

## Security Considerations

1. **Session Security**:
   - Sessions use HTTP-only cookies
   - In production, secure flag is enabled
   - Session secret should be stored in environment variables

2. **Password Requirements**:
   - Minimum 8 characters
   - Must contain numbers and letters
   - Password complexity validation on both client and server

3. **Rate Limiting**:
   - Consider implementing rate limiting for login attempts
   - Add CAPTCHA for registration and login forms

4. **Environment Variables**:
   - Store sensitive configuration in environment variables
   - Never commit secrets to version control

## Testing Authentication

To test the authentication system:

1. **Registration**: Verify new users can register with valid details
2. **Login**: Confirm users can log in with correct credentials
3. **Access Control**: Test that role-based access correctly restricts unauthorized actions
4. **Session Management**: Verify sessions persist and expire as expected
5. **Password Security**: Confirm password change functionality works correctly
