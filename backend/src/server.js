const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const equipmentRoutes = require('./routes/equipment');
const equipmentCategoryRoutes = require('./routes/equipmentCategories');
const maintenanceTeamRoutes = require('./routes/maintenanceTeams');
const maintenanceRequestRoutes = require('./routes/maintenanceRequests');
const workCenterRoutes = require('./routes/workCenters');
const dashboardRoutes = require('./routes/dashboard');
const invitationRoutes = require('./routes/invitations');
const notificationRoutes = require('./routes/notifications');

// Import auth middleware
const { auth } = require('./middleware/auth');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/equipment-categories', equipmentCategoryRoutes);
app.use('/api/maintenance-teams', maintenanceTeamRoutes);
app.use('/api/maintenance-requests', maintenanceRequestRoutes);
app.use('/api/work-centers', workCenterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invitations', auth, invitationRoutes);
app.use('/api/notifications', auth, notificationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('✅ All routes loaded successfully');
});

module.exports = app;
