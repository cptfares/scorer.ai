# StartupEval - Jury Evaluation System

## Overview

StartupEval is a comprehensive web application designed for managing startup evaluation processes. It provides a platform for administrators to manage startup cohorts, jury members, and evaluation criteria while enabling jury members to evaluate startups through structured assessment forms. The system supports multi-phase evaluation workflows with detailed analytics and reporting capabilities.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React-based single-page application using TypeScript
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Build System**: Vite for frontend bundling and development
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Chart.js integration for data visualization
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Design**: RESTful API endpoints with proper error handling
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: Hot module replacement with Vite integration

### Database Schema
The database includes the following core entities:
- **Users**: Admin and jury member accounts with role-based access
- **Phases**: Evaluation cohorts/phases for organizing startups
- **Startups**: Company profiles with detailed information
- **Evaluation Criteria**: Customizable scoring criteria
- **Jury Assignments**: Mapping jury members to evaluation phases
- **Evaluations**: Individual startup assessments by jury members
- **Decision Labels**: Standardized decision outcomes

## Data Flow

1. **User Management**: Administrators create and manage jury member accounts
2. **Phase Setup**: Administrators create evaluation phases and assign jury members
3. **Startup Registration**: Startups are added to specific evaluation phases
4. **Evaluation Process**: Jury members evaluate assigned startups using structured criteria
5. **Analytics**: System aggregates evaluation data for reporting and decision-making

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling with validation
- **zod**: Runtime type validation and schema definition
- **chart.js**: Data visualization for analytics
- **@radix-ui/***: Accessible UI component primitives

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **@types/***: TypeScript definitions

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development Mode
- Vite dev server for frontend with hot module replacement
- Express server with automatic restarts via tsx
- Database migrations managed through Drizzle Kit

### Production Build
- Frontend built to static assets via Vite
- Backend bundled as ESM module via esbuild
- Single server process serving both API and static files

### Database Management
- Schema defined in shared TypeScript files
- Migrations generated and applied through Drizzle Kit
- Environment-based database URL configuration

### Environment Configuration
- DATABASE_URL: PostgreSQL connection string (required)
- NODE_ENV: Environment flag (development/production)
- Build scripts configured for Replit deployment

## Changelog

Changelog:
- June 30, 2025. Initial setup

## User Preferences

- Preferred communication style: Simple, everyday language
- Primary brand color: #0F7894 (replacing previous #007ea4)
- Authentication required: Admin login system with jury member authentication
- Color scheme: Professional, colorful design (not black and white)
- Required features: 
  - Admin can invite jury members and assign to cohorts
  - Jury members login with email/password provided by admin
  - Jury can view startup info and make evaluations