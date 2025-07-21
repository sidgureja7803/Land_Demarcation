# Land Demarcation Tracker - Replit.md

## Overview

This is a full-stack land demarcation tracking system designed for ADC Mahendragarh. The application allows officers to track plot-wise demarcation activities, create logs, and manage land-related administrative tasks. It's built with a modern tech stack using React for the frontend, Express for the backend, and PostgreSQL with Drizzle ORM for data management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Database Schema (shared/schema.ts)
The system uses a hierarchical geographical structure:
- **Users**: Officers with roles (officer, supervisor, administrator)
- **Circles**: Administrative divisions with assigned officers
- **Districts**: Geographic districts containing circles
- **Villages**: Villages within circles
- **Plots**: Individual land plots with detailed information
- **Demarcation Logs**: Activity tracking for each plot
- **Plot Assignments**: Assignment of plots to officers

### Authentication System
- Uses Replit Auth for secure user authentication
- Role-based access control (officer, supervisor, administrator)
- Session management with PostgreSQL storage
- Middleware for protecting routes and user verification

### Frontend Pages
- **Landing**: Public homepage with login functionality
- **Dashboard**: Overview with statistics and recent activities
- **Plots**: Management of assigned plots with filtering
- **New Log**: Form for creating demarcation activity logs
- **History**: Historical view of all demarcation activities

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions are stored in PostgreSQL
2. **Data Fetching**: Frontend uses TanStack Query to fetch data from Express API endpoints
3. **Form Submission**: Forms use React Hook Form with Zod validation, data is sent to Express routes
4. **Database Operations**: Express routes use Drizzle ORM to interact with PostgreSQL database
5. **Real-time Updates**: Query invalidation ensures UI stays synchronized with database changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **express**: Web framework for API routes
- **wouter**: Lightweight React router

### UI/UX Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form handling
- **zod**: Schema validation

### Authentication Dependencies
- **openid-client**: OpenID Connect client for Replit Auth
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development
- Uses Vite dev server for frontend hot reloading
- Express server with TypeScript compilation via tsx
- Database migrations managed through Drizzle Kit
- Environment variables for database connection and auth configuration

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles Express server with external dependencies
- Database: Drizzle migrations ensure schema consistency
- Deployment: Single Node.js process serving both API and static files

### Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Authentication**: Requires Replit-specific environment variables
- **Sessions**: Uses secure session configuration with PostgreSQL storage

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```