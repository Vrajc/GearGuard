const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const equipmentRoutes = require('./routes/equipment');
const equipmentCategoryRoutes = require('./routes/equipmentCategories');
const maintenanceRequestRoutes = require('./routes/maintenanceRequests');
const maintenanceTeamRoutes = require('./routes/maintenanceTeams');
const workCenterRoutes = require('./routes/workCenters');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  console.log('   Headers:', req.headers.authorization ? 'Auth token present' : 'No auth token');
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes - with logging
console.log('📍 Registering routes...');

// List all registered routes after setup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/equipment-categories', equipmentCategoryRoutes);
app.use('/api/maintenance-requests', maintenanceRequestRoutes);
app.use('/api/maintenance-teams', maintenanceTeamRoutes);
app.use('/api/work-centers', workCenterRoutes);

console.log('✅ All routes registered');

// Debug: Print all registered routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`  Route: ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const path = middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '').replace(/\\\//g, '/');
        console.log(`  Route: ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
      }
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Test route to verify maintenance teams endpoint
app.get('/api/test/teams', (req, res) => {
  res.json({ message: 'Teams endpoint is working' });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found', url: req.url, method: req.method });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('📍 Available routes:');
  console.log('   - GET    /api/test/teams');
  console.log('   - GET    /api/maintenance-teams/test');
  console.log('   - POST   /api/maintenance-teams');
  console.log('   - GET    /api/maintenance-teams');
  console.log('   - GET    /api/health');
  console.log('\n🔥 Try: http://localhost:5000/api/maintenance-teams/test');
});