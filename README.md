<<<<<<< HEAD
# GearGuard

**The Ultimate Maintenance Tracker**

An Odoo-style enterprise maintenance management system built with Next.js, Tailwind CSS, and MongoDB.

## Features

### Core Modules
- 🎯 **Dashboard** - Real-time KPIs and maintenance overview
- 🔧 **Equipment Management** - Track equipment health and maintenance
- 📋 **Maintenance Requests** - Corrective and preventive maintenance workflow
- 👥 **Maintenance Teams** - Organize technicians and assignments
- 🏭 **Work Centers** - Manage production areas
- 📊 **Reports** - Analytics and insights
- 📅 **Calendar** - Schedule preventive maintenance

### User Roles
- **Admin** - Full system access
- **Manager** - Assign and schedule maintenance
- **Technician** - Execute and update maintenance tasks
- **Employee** - Create maintenance requests

### Key Features
- Kanban board with drag-and-drop
- Smart auto-fill (category, team) based on equipment
- Equipment health tracking
- Preventive maintenance scheduling
- Real-time dashboard with KPIs
- Odoo-style enterprise UI
- Role-based access control
- Smart buttons showing maintenance counts per equipment

## Complete Workflow Implementation

### Flow 1: The Breakdown (Corrective Maintenance)

1. **Request Creation**: Any user can create a maintenance request
   - Navigate to Maintenance Requests page
   - Click "+ New Request"
   - Fill in subject (e.g., "Leaking Oil")

2. **Auto-Fill Logic**: 
   - When user selects an Equipment (e.g., "Hydraulic Press HP-001")
   - System automatically fetches:
     - Equipment Category (e.g., "Hydraulic Equipment")
     - Maintenance Team (e.g., "Mechanical Team")
   - These fields are pre-filled in the request

3. **Request Lifecycle**:
   - **New Stage**: Request starts here automatically
   - **Assignment**: Manager or technician assigns themselves
   - **In Progress**: Stage moves when work begins
   - **Repaired**: Technician records duration and completes
   - **Scrap**: If equipment is beyond repair

### Flow 2: The Routine Checkup (Preventive Maintenance)

1. **Scheduling**:
   - Manager creates request with type "Preventive"
   - Sets scheduled date (e.g., "Next Monday")
   - Assigns equipment and team

2. **Calendar Integration**:
   - Request appears on Calendar View on scheduled date
   - Technicians see upcoming jobs
   - Can schedule new maintenance from calendar

3. **Execution**:
   - Technician performs preventive maintenance
   - Records duration and findings
   - Moves to "Repaired" stage

### Smart Features

#### 1. Equipment Smart Buttons
- On Equipment details, view button shows "Maintenance Requests"
- Badge displays count of open requests (New + In Progress)
- Click to see all maintenance history for that equipment

#### 2. Auto-Fill Intelligence
- Selecting equipment auto-fills:
  - Category
  - Maintenance Team
  - Assigned Technician (from equipment default)

#### 3. Scrap Logic
- Moving request to "Scrap" stage automatically:
  - Marks equipment as scrapped
  - Sets scrap date
  - Updates equipment status to "Scrapped"
  - Equipment removed from active tracking

#### 4. Team-Based Workflow
- Requests filtered by maintenance team
- Only team members can see and work on their team's requests
- Specialized teams (Mechanics, Electricians, IT Support)

#### 5. Equipment Tracking
- **By Department**: Group equipment by department/location
- **By Employee**: Track who uses which equipment
- **By Category**: Organize by equipment type
- **By Team**: Filter by responsible maintenance team

### Dashboard KPIs

Real-time statistics displayed:
- **Total Equipment**: Count of active equipment (excluding scrapped)
- **Active Requests**: Open maintenance requests (New + In Progress)
- **Average Equipment Health**: Overall health percentage across all equipment
- **Upcoming Maintenance**: Scheduled maintenance in next 7 days
- **Total Technicians**: Available maintenance staff
- **Completed This Month**: Maintenance tasks finished this month

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS (Dark enterprise theme)
- Heroicons / Material Icons

### Backend
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Express Validator

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd GearGuard
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your settings:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string for JWT signing
# - PORT: Backend server port (default: 5000)
```

### 3. Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
# Edit .env.local file:
# - NEXT_PUBLIC_API_URL: Backend API URL (default: http://localhost:5000/api)
```

## Running the Application

### Start MongoDB Atlas Connection

Your backend is configured to use MongoDB Atlas (cloud database):
- Database: `gg`
- Connection string is already configured in `backend/.env`
- No local MongoDB installation needed
- Database will be created automatically on first data insert

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend API will start on `http://localhost:5000`

**Note:** The `gg` database will appear in MongoDB Atlas after you create your first user or data entry.

### Start Frontend Application

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Initial Setup - Create First User

1. Navigate to `http://localhost:3000`
2. Click "Sign Up" to register your first user
3. This will create the `gg` database and `users` collection in MongoDB Atlas
4. Check MongoDB Atlas - the database should now be visible

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password/:token` - Reset password with token

### User Routes
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Protected)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Item Routes
- `GET /api/items` - Get all items (Protected)
- `GET /api/items/:id` - Get item by ID (Protected)
- `POST /api/items` - Create new item (Protected)
- `PUT /api/items/:id` - Update item (Protected)
- `DELETE /api/items/:id` - Delete item (Protected)

### Equipment
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get equipment by ID
- `POST /api/equipment` - Create equipment (Manager/Admin)
- `PUT /api/equipment/:id` - Update equipment (Manager/Admin)
- `DELETE /api/equipment/:id` - Delete equipment (Admin)

### Maintenance Requests
- `GET /api/maintenance-requests` - Get all requests
- `GET /api/maintenance-requests/:id` - Get request by ID
- `POST /api/maintenance-requests` - Create request
- `PUT /api/maintenance-requests/:id` - Update request
- `DELETE /api/maintenance-requests/:id` - Delete request

### Health Check
- `GET /api/health` - Check API status

### Dashboard Routes
- `GET /api/dashboard/stats` - Get dashboard KPI statistics

### Equipment Routes (Enhanced)
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get equipment by ID
- `GET /api/equipment/:id/stats` - Get maintenance statistics for equipment
- `POST /api/equipment` - Create equipment (Manager/Admin)
- `PUT /api/equipment/:id` - Update equipment (Manager/Admin)
- `DELETE /api/equipment/:id` - Delete equipment (Admin)


## Database Models

### User Model
- name (String, required)
- email (String, required, unique)
- password (String, required, hashed)
- role (String, enum: ['user', 'admin'])
- isActive (Boolean)
- timestamps (createdAt, updatedAt)

### Item Model
- name (String, required)
- description (String, required)
- category (String, enum: ['Electronics', 'Tools', 'Equipment', 'Accessories', 'Other'])
- quantity (Number, required)
- location (String, required)
- status (String, enum: ['Available', 'In Use', 'Maintenance', 'Retired'])
- owner (ObjectId, ref: 'User')
- timestamps (createdAt, updatedAt)

### Equipment
- name, serialNumber, category
- purchaseDate, warrantyExpiry
- location, usedBy
- maintenanceTeam, assignedTechnician
- workCenter, healthPercentage
- isScrap, scrapDate
- status, company

### MaintenanceRequest
- subject, createdBy, requestType
- equipment OR workCenter
- category (auto-filled)
- maintenanceTeam (auto-filled)
- technician, priority
- scheduledDate, duration
- stage (New → In Progress → Repaired → Scrap)
- notes, instructions

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes with middleware
- Role-based access control
- Input validation with express-validator
- Password reset tokens with expiration
- Secure email delivery
- CORS enabled
- Environment variable configuration

## Tech Stack

### Frontend
- **Framework:** Next.js 14
- **UI:** React 18, Tailwind CSS
- **Language:** TypeScript
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS with custom theme

### Backend
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** bcryptjs, CORS
- **Dev Tools:** Nodemon


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue in the repository.

---

**Note:** Remember to change the JWT_SECRET in production and never commit .env files to version control!

## Application Workflow

### 1. Landing Page (`/`)
- Public page showcasing GearGuard features
- Login and Sign Up call-to-action buttons
- Automatically redirects to dashboard if user is already logged in
- Footer with links (Privacy, Terms, Support)

### 2. Authentication (`/login` or `/register`)
- User must login or create an account
- Password validation with strength requirements
- Email uniqueness validation
- JWT token-based authentication
- No footer displayed on authentication pages

### 3. Main Application (After Login)
- Access to full application features:
  - Dashboard with KPIs
  - Equipment Management
  - Maintenance Requests
  - Team Management
  - Calendar View
- Protected routes - redirects to login if not authenticated
- Header with navigation and user menu
- No footer displayed on application pages
- Logout functionality

## Authentication Features

### Login Page
- Email and password validation
- Error handling for invalid credentials
- "Account not exist" error for non-existent users
- "Invalid Password" error for wrong passwords
- Forgot password link
- Redirect to signup page

### Signup Page
- Full name, email, and password fields
- Password confirmation field
- Email uniqueness validation
- Password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one special character
- Duplicate email detection
- Automatic login after successful registration
- Welcome email sent on registration

### Forgot Password
- Email validation
- Password reset link sent via email
- Reset link expires after 1 hour
- Professional email template with branding

### Reset Password Page
- Secure token-based password reset
- Password strength validation
- Real-time validation feedback
- Automatic login after successful reset
- Invalid/expired token handling

## Email Configuration

The application uses Gmail SMTP for sending emails. To set up:

1. **Enable 2-Step Verification** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (remove spaces)

3. **Update `backend/.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdabcdabcdabcd
   EMAIL_FROM=GearGuard <your-email@gmail.com>
   ```

4. **Important Notes**:
   - Use the 16-character app password, NOT your Gmail password
   - Remove all spaces from the app password
   - Keep the app password secure and never commit it to Git

**Email Features:**
- Password reset emails with branded template
- Welcome emails for new users
- Secure reset links with 1-hour expiration
- Professional HTML email formatting

**Testing Email Configuration:**
```bash
cd backend
node -e "require('./src/utils/email').sendPasswordResetEmail('test@example.com', 'test-token')"
```
=======
# GearGuard
>>>>>>> d434c11c59c9c5276cd1a3e61c39d2442915b603
