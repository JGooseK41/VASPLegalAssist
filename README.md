# VASP Legal Process Assistant

A comprehensive web application for law enforcement agencies to generate legal process documents for Virtual Asset Service Providers (VASPs).

## Features

- **User Authentication**: Secure login system with demo account support
- **VASP Database**: Search and filter through 100+ VASPs with compliance information
- **Document Templates**: Customizable letterhead and subpoena templates per user
- **Document Generation**: Auto-fill VASP information and generate PDF documents
- **Transaction Import**: CSV upload for bulk transaction processing
- **Document History**: Track last 10 documents with quick duplication
- **Profile Management**: Manage user information and agency details

## Demo Account

You can explore the application using our demo account:
- Email: `demo@vaspla.gov`
- Password: `demo2024`

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd vasp-legal-assistant
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies  
cd backend
npm install
cd ..
```

3. Set up the database:
```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

4. Configure environment variables:
The `.env` file is already configured with default values for development.

### Running the Application

#### Option 1: Run frontend and backend separately

Terminal 1 - Backend:
```bash
cd backend
npm run server
```

Terminal 2 - Frontend:
```bash
npm start
```

#### Option 2: Run both concurrently
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Application Structure

```
vasp-legal-assistant/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth)
│   ├── services/          # API service layer
│   └── App.js            # Main application component
├── backend/               # Backend Node.js/Express API
│   ├── controllers/       # Route controllers
│   ├── routes/           # API routes
│   ├── services/         # Business logic (PDF, CSV)
│   ├── middleware/       # Express middleware
│   └── server.js         # Express server
├── public/               # Static files
│   └── ComplianceGuide.csv # VASP database
└── prisma/               # Database schema
```

## Key Features Implementation

### 1. User Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Demo account for testing
- Persistent sessions with localStorage

### 2. Document Templates
- Each user gets default letterhead and subpoena templates
- Templates are fully customizable with:
  - Agency header and address
  - Contact information
  - Footer text
  - Signature blocks
- Set default templates for quick document creation

### 3. Document Generation Workflow
1. Search for VASP in the database
2. Select VASP to auto-populate information
3. Enter case details:
   - Case number
   - Crime description
   - Applicable statute
   - Transaction details
4. Select information types to request
5. Generate and download PDF

### 4. CSV Transaction Import
- Upload CSV files with transaction data
- Supported columns:
  - transaction_hash
  - date
  - amount
  - from_address
  - to_address
  - notes
- Automatic validation and error reporting

### 5. Document History
- View last 10 generated documents
- Quick duplicate function for similar requests
- Download previously generated PDFs

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Change password

### Templates
- `GET /api/templates` - List user templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `POST /api/documents/import-transactions` - Import CSV

### VASPs
- `GET /api/vasps` - List all VASPs
- `GET /api/vasps/:id` - Get VASP details

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days (1 hour for demo)
- Demo accounts have limited permissions
- All API routes require authentication
- CORS configured for frontend origin only

## Future Enhancements

- Email integration for sending documents
- Multi-factor authentication
- Audit logging
- Advanced search filters
- Batch document generation
- Template sharing between users
- Document approval workflow
- Integration with blockchain explorers

## Troubleshooting

### Database Issues
If you encounter database errors:
```bash
cd backend
rm prisma/vasp.db
npx prisma db push
```

### Port Conflicts
If ports 3000 or 5000 are in use, update:
- Frontend: `package.json` scripts
- Backend: `.env` PORT variable

### CSV Import Issues
Ensure CSV files have proper headers and UTF-8 encoding.

## License

This project is for educational and law enforcement use only.