# PillNow Backend API

A comprehensive backend API for the PillNow medication management system, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for users (Admin, Elder, Caregiver)
- **Caregiver-Elder Connections**: Manage relationships between caregivers and elders
- **Medication Schedules**: Create, update, and manage medication schedules
- **Security**: Input validation, rate limiting, and security headers
- **Database**: MongoDB with Mongoose ODM

## Project Structure

```
backend/
├── models/                 # Database models
│   ├── User.js            # User model with authentication
│   ├── CaregiverConnection.js  # Caregiver-elder relationships
│   └── MedicationSchedule.js   # Medication schedules
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   ├── caregivers.js      # Caregiver-specific routes
│   └── medications.js     # Medication schedule routes
├── middleware/            # Custom middleware
│   └── auth.js           # Authentication & authorization
├── server.js             # Main server file
├── package.json          # Dependencies
└── env.example           # Environment variables template
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:userId` - Get specific user
- `GET /api/users/search/elders` - Search for elders by contact number
- `GET /api/users/phone/:contactNumber` - Get elder by contact number
- `GET /api/users/role/elders` - Get all elders
- `PUT /api/users/:userId` - Update user (Admin only)
- `DELETE /api/users/:userId` - Deactivate user (Admin only)

### Caregiver Operations
- `POST /api/caregivers/connect-elder` - Connect to elder by contact number
- `GET /api/caregivers/connections` - Get caregiver's connected elders
- `GET /api/caregivers/connections/:connectionId` - Get specific connection details
- `PUT /api/caregivers/connections/:connectionId` - Update connection
- `DELETE /api/caregivers/connections/:connectionId` - Remove connection
- `GET /api/caregivers/search-elders` - Search for elders

### Medication Schedules
- `POST /api/medications/schedules` - Create new medication schedule
- `GET /api/medications/schedules` - Get medication schedules
- `GET /api/medications/schedules/:scheduleId` - Get specific schedule
- `PUT /api/medications/schedules/:scheduleId` - Update medication schedule
- `DELETE /api/medications/schedules/:scheduleId` - Delete medication schedule

## User Roles

1. **Admin (role: 1)**: Full access to all features
2. **Elder (role: 2)**: Can manage their own medication schedules
3. **Caregiver (role: 3)**: Can connect to elders and view their schedules

## Database Models

### User Model
- `userId`: Unique identifier
- `name`: User's full name
- `email`: Email address (unique)
- `contactNumber`: Phone number (unique)
- `password`: Hashed password
- `role`: User role (1=Admin, 2=Elder, 3=Caregiver)
- `age`: Optional age field
- `isActive`: Account status

### CaregiverConnection Model
- `caregiverId`: Reference to caregiver user
- `elderId`: Reference to elder user
- `elderName`, `elderContactNumber`, `elderEmail`: Elder details
- `connectionStatus`: active/inactive/pending
- `connectedAt`: Connection timestamp
- `notes`: Optional notes

### MedicationSchedule Model
- `userId`: Reference to user (elder)
- `medicationName`: Name of medication
- `dosage`: Dosage information
- `frequency`: daily/twice_daily/thrice_daily/weekly/custom
- `timeSlots`: Array of time slots
- `daysOfWeek`: Days when medication should be taken
- `startDate`, `endDate`: Schedule duration
- `isActive`: Schedule status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Prevents abuse with request rate limiting
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS settings
- **Password Hashing**: bcryptjs for secure password storage

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pillnow
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Code Formatting
```bash
npm run format
```

## Deployment

1. Set up environment variables for production
2. Configure MongoDB connection string
3. Set appropriate CORS origins
4. Use a process manager like PM2
5. Set up SSL/TLS certificates
6. Configure reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details









