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

## Recent Changes
- July 01, 2025: Enhanced application to comprehensive insurance document management platform
  - Added PostgreSQL database integration with full schema for documents, history, and settings
  - Implemented advanced processing options with configurable AI analysis parameters
  - Created document dashboard with search, filtering, favorites, and management features
  - Added comprehensive summary history with version tracking and comparison
  - Built user settings interface for customizing processing defaults and preferences
  - Enhanced navigation with sidebar layout and multi-page structure
  - Added support for tags, client information, and policy references
  - Implemented document statistics and usage tracking
- July 02, 2025: Major improvements to AI accuracy and client-focused summaries
  - Completely overhauled xAI prompts to prioritize accuracy and avoid assumptions
  - Added document inconsistency tracking (policy numbers, names, dates)
  - Implemented verification fields for unverified information
  - Enhanced exclusions prominence with form codes
  - Shifted from technical verification focus to client value explanations
  - Increased PDF extraction limit from 20 to 100 pages for comprehensive analysis
  - Created engaging, narrative-style summaries that explain coverage value
  - Added business context detection for restaurant/bar operations
  - Fixed remaining dark mode issues in CleanSummaryPreview component
  - Enhanced AI token limits (analysis: 4000→8000, summaries: 1500→6000) with auto-retry logic
  - Implemented response validation to prevent truncated summaries
- July 02, 2025: Complete PDF export overhaul for professional-grade output
  - Redesigned PDF generator with sophisticated typography and layout
  - Added proper markdown parsing for bold headings, bullet points, and paragraphs
  - Implemented professional styling with gradients, shadows, and branded colors
  - Enhanced client information display with customizable headers and signatures
  - Added A4-optimized layout with proper print margins and page breaks
  - Created professional footer with Valley Trust contact information
  - Integrated comprehensive summary formatting that matches screen preview quality
- July 02, 2025: Optimized summary length for digestibility and readability
  - Reduced AI summary target from 800-1200 words to 400-600 words for 2-4 page PDFs
  - Modified prompts to focus on essential information rather than comprehensive detail
  - Updated token limits from 6000 to 3000 tokens for more concise output
  - Restructured summary sections to prioritize key coverage highlights
  - Enhanced readability for busy business owners who need quick understanding
- July 02, 2025: Transformed to dense, integrated narrative format
  - Replaced sectioned format with flowing, narrative-style summaries
  - Integrated multiple coverage types within comprehensive paragraphs
  - Maximized information density while maintaining 400-600 word target
  - Created seamless flow that weaves exclusions and benefits naturally within coverage explanations
  - Optimized for comprehensive understanding in compact 2-4 page format
- July 02, 2025: Restructured to cohesive 5-paragraph narrative format
  - Eliminated all section headers, bullet points, and bold formatting
  - Created flowing business document style with 5 substantial paragraphs
  - Each paragraph targets 80-120 words of comprehensive, detailed content
  - Structured as: policy foundation, core liability, property/operational, coverage boundaries, recommendations
  - Designed for professional readability with seamless paragraph transitions
- July 02, 2025: Made Export PDF button fully functional in PolicySummaryGenerator
  - Added PDF export mutation with proper error handling and loading states
  - Integrated toast notifications for success and error feedback
  - Connected to existing professional PDF generator with branded output
  - Button shows "Exporting..." during processing and auto-downloads completed PDF
  - Uses enhanced PDF generator with A4 layout, professional typography, and Valley Trust branding
- July 02, 2025: Simplified PolicySummaryGenerator workflow for cleaner user experience
  - Removed "Extracted Data", "Export Options", and "Processing Options" tabs/components
  - Streamlined to essential features: document upload, summary preview, and PDF export
  - Eliminated complex tabbed interface in favor of clean single-page workflow
  - Maintained all core functionality while reducing UI complexity
  - Created focused, simplified workflow that emphasizes the three key actions users need
- July 03, 2025: Enhanced summary format with subheaders and added edit functionality
  - Modified xAI prompts to generate descriptive subheaders in brackets [like this] for each paragraph
  - Updated CleanSummaryPreview component to parse and display subheaders as styled section headers
  - Created new SummaryEditor component for agents to edit summaries before PDF export
  - Implemented side-by-side layout with summary preview and edit sections
  - Added save/reset functionality with visual feedback for unsaved changes
  - Integrated edit capabilities directly into the PolicySummaryGenerator workflow
- July 03, 2025: Replaced side-by-side layout with tab structure for better space utilization
  - Changed dual-column layout to tabbed interface with "Summary Preview" and "Edit Summary" tabs
  - Added Eye and Edit3 icons to tab headers for better visual identification
  - Improved space utilization by removing horizontal squishing from side-by-side layout
  - Enhanced processing status text to show accurate states: "No document selected", "Processing document...", "Processing completed", or "Ready to process"
  - Maintained all editing functionality while improving interface efficiency
- July 03, 2025: Completely overhauled PDF formatting for professional-grade output
  - Enhanced PDF generator to properly handle new subheader format [like this] with styled section blocks
  - Improved typography with better font rendering, line spacing, and text justification
  - Added sophisticated section styling with gradient headers, borders, and shadows
  - Created professional section blocks with background colors and left borders
  - Enhanced bullet point formatting with improved spacing and visual hierarchy
  - Upgraded policy header with gradient backgrounds and enhanced visual effects
  - Improved overall document structure with better spacing and professional layout
- July 03, 2025: Simplified PDF formatting for cleaner, stronger output
  - Removed complex gradients, shadows, and rounded corners for simpler, professional appearance
  - Streamlined section headers to use clean border-bottom style instead of gradient boxes
  - Simplified bullet point styling with cleaner spacing and minimal decoration
  - Made policy header clean and strong with solid background instead of gradients
  - Reduced padding and margins for more efficient space utilization
  - Focused on typography and clear hierarchy over decorative elements
- July 03, 2025: Implemented real-time preview updates between edit and preview tabs
  - Modified SummaryEditor to update preview in real-time as user types
  - Enhanced CleanSummaryPreview to accept and display edited summary content
  - Connected edit and preview tabs for seamless workflow without manual save requirement
  - Maintained save functionality for explicit confirmation but enabled live preview
  - PDF export automatically uses edited summary when available
- July 03, 2025: Fixed and enhanced save functionality for summary editing
  - Added backend PATCH endpoint `/api/documents/:id/summary` for persisting summary changes
  - Created proper mutation in SummaryEditor with loading states and error handling
  - Implemented cache invalidation to ensure saved changes reflect immediately in UI
  - Added save button loading state ("Saving...") and proper success/error feedback
  - Clear edited summary state when switching between documents to prevent confusion
  - Reset function properly clears preview and reverts to original document summary

## Changelog
- July 01, 2025. Initial setup
- July 01, 2025. Major enhancement: Transformed from simple PDF processor to comprehensive document management platform

## User Preferences

Preferred communication style: Simple, everyday language.
Request: Make application "way way more functional and incredible" with document history management, settings, and processing options.