# Policy Summary Generator

## Overview

This is a full-stack policy document processing application built for Valley Trust Insurance. The system allows users to upload insurance policy documents (PDF and DOCX), automatically extract key information using AI, and generate professional summaries for clients. The application features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and OpenAI for intelligent document processing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Valley Trust Insurance branding
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: React Dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ES modules)
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Processing**: Multer for file uploads, mammoth for DOCX, pdf-parse for PDF
- **AI Integration**: OpenAI GPT-4o for document analysis and data extraction
- **PDF Generation**: Puppeteer for creating formatted policy summaries
- **Development**: tsx for TypeScript execution, esbuild for production builds

## Key Components

### Document Processing Pipeline
1. **File Upload**: Accepts PDF and DOCX files up to 10MB
2. **Text Extraction**: Converts documents to plain text using specialized parsers
3. **AI Analysis**: Uses OpenAI to extract structured policy data and generate summaries
4. **Data Storage**: Stores extracted information in PostgreSQL with JSON fields
5. **PDF Export**: Generates branded PDF summaries using HTML templates

### Database Schema
- **Users Table**: Basic user authentication (username/password)
- **Policy Documents Table**: 
  - File metadata (name, size, type, upload date)
  - Processing status and error handling
  - Extracted policy data (JSON format)
  - Generated summaries and explanations

### API Endpoints
- `POST /api/documents/upload` - Upload and process policy documents
- `GET /api/documents/:id` - Retrieve processed document data
- `GET /api/documents` - List all documents
- `POST /api/documents/:id/export` - Generate PDF summary
- `DELETE /api/documents/:id` - Remove document

## Data Flow

1. **Upload Phase**: User drags/drops or selects policy document
2. **Processing Phase**: 
   - File validation and storage
   - Text extraction from PDF/DOCX
   - AI analysis to extract policy data
   - Summary generation
3. **Preview Phase**: User reviews extracted data and generated summary
4. **Export Phase**: Generate branded PDF with customization options
5. **Management Phase**: View, edit, or delete processed documents

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL (via Neon serverless)
- **AI Service**: OpenAI API (GPT-4o model)
- **File Processing**: 
  - pdf-parse for PDF text extraction
  - mammoth for DOCX text extraction
  - puppeteer for PDF generation

### UI and Styling
- **Component Library**: Radix UI primitives
- **Styling**: Tailwind CSS with custom Valley Trust branding
- **Icons**: Lucide React icons
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across frontend and backend
- **Database Migrations**: Drizzle Kit for schema management
- **Development**: Replit-specific plugins for enhanced development experience

## Deployment Strategy

### Development Environment
- Uses tsx for TypeScript execution in development
- Vite dev server with HMR for frontend
- Memory storage fallback for development without database
- Environment variable configuration for API keys

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles server code into single file
- Database: Drizzle migrations for schema deployment
- Deployment: Single command build process (`npm run build`)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for document processing
- `NODE_ENV` - Environment flag (development/production)

## Changelog
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.