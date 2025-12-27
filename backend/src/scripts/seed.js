const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const EquipmentCategory = require('../models/EquipmentCategory');
const WorkCenter = require('../models/WorkCenter');
const MaintenanceTeam = require('../models/MaintenanceTeam');
const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    await EquipmentCategory.deleteMany({});
    await WorkCenter.deleteMany({});
    await MaintenanceTeam.deleteMany({});
    await Equipment.deleteMany({});
    await MaintenanceRequest.deleteMany({});

    console.log('Existing data cleared');

    // Create users (if none exist)
    const userCount = await User.countDocuments();
    let users;
    
    if (userCount === 0) {
      users = await User.create([
        {
          name: 'Admin User',
          email: 'admin@gearguard.com',
          password: 'Admin@123',
          role: 'admin',
        },
        {
          name: 'John Manager',
          email: 'manager@gearguard.com',
          password: 'Manager@123',
          role: 'manager',
        },
        {
          name: 'Mike Technician',
          email: 'tech1@gearguard.com',
          password: 'Tech@123',
          role: 'technician',
        },
        {
          name: 'Sarah Technician',
          email: 'tech2@gearguard.com',
          password: 'Tech@123',
          role: 'technician',
        },
        {
          name: 'Employee One',
          email: 'emp1@gearguard.com',
          password: 'Emp@123',
          role: 'employee',
        },
      ]);
      console.log('Users created');
    } else {
      users = await User.find();
      console.log('Using existing users');
    }

    // Create Equipment Categories
    const categories = await EquipmentCategory.create([
      {
        name: 'Hydraulic Equipment',
        responsibleUser: users[0]._id,
        description: 'Hydraulic pumps, cylinders, and systems',
      },
      {
        name: 'Electrical Equipment',
        responsibleUser: users[1]._id,
        description: 'Motors, generators, and electrical systems',
      },
      {
        name: 'HVAC Systems',
        responsibleUser: users[0]._id,
        description: 'Heating, ventilation, and air conditioning',
      },
      {
        name: 'Production Machinery',
        responsibleUser: users[1]._id,
        description: 'CNC machines, lathes, and production equipment',
      },
    ]);
    console.log('Equipment categories created');

    // Create Work Centers
    const workCenters = await WorkCenter.create([
      {
        name: 'Assembly Line A',
        code: 'AL-A-001',
        tag: 'Main Assembly',
        costPerHour: 150,
        capacity: 10,
        timeEfficiency: 85,
        oeeTarget: 80,
      },
      {
        name: 'Machining Center',
        code: 'MC-001',
        tag: 'CNC Operations',
        costPerHour: 200,
        capacity: 5,
        timeEfficiency: 90,
        oeeTarget: 85,
      },
      {
        name: 'Quality Control',
        code: 'QC-001',
        tag: 'Inspection',
        costPerHour: 100,
        capacity: 8,
        timeEfficiency: 95,
        oeeTarget: 90,
      },
    ]);
    console.log('Work centers created');

    // Create Maintenance Teams
    const teams = await MaintenanceTeam.create([
      {
        name: 'Mechanical Team',
        members: [users[2]._id, users[3]._id],
      },
      {
        name: 'Electrical Team',
        members: [users[2]._id],
      },
      {
        name: 'HVAC Team',
        members: [users[3]._id],
      },
    ]);
    console.log('Maintenance teams created');

    // Create Equipment
    const equipment = await Equipment.create([
      {
        name: 'Hydraulic Press HP-001',
        serialNumber: 'HP-2024-001',
        category: categories[0]._id,
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2026-01-15'),
        location: 'Production Floor A',
        maintenanceTeam: teams[0]._id,
        assignedTechnician: users[2]._id,
        workCenter: workCenters[0]._id,
        healthPercentage: 85,
        status: 'Active',
        description: 'Main hydraulic press for metal forming',
      },
      {
        name: 'CNC Machine M-200',
        serialNumber: 'CNC-2024-002',
        category: categories[3]._id,
        purchaseDate: new Date('2023-06-20'),
        warrantyExpiry: new Date('2026-06-20'),
        location: 'Machining Center',
        maintenanceTeam: teams[0]._id,
        assignedTechnician: users[3]._id,
        workCenter: workCenters[1]._id,
        healthPercentage: 92,
        status: 'Active',
        description: '5-axis CNC machining center',
      },
      {
        name: 'HVAC Unit A1',
        serialNumber: 'HVAC-2024-003',
        category: categories[2]._id,
        purchaseDate: new Date('2022-03-10'),
        warrantyExpiry: new Date('2025-03-10'),
        location: 'Building A',
        maintenanceTeam: teams[2]._id,
        assignedTechnician: users[3]._id,
        healthPercentage: 78,
        status: 'Active',
        description: 'Main HVAC system for production area',
      },
      {
        name: 'Electric Motor EM-500',
        serialNumber: 'EM-2024-004',
        category: categories[1]._id,
        purchaseDate: new Date('2023-09-01'),
        warrantyExpiry: new Date('2026-09-01'),
        location: 'Assembly Line A',
        maintenanceTeam: teams[1]._id,
        assignedTechnician: users[2]._id,
        workCenter: workCenters[0]._id,
        healthPercentage: 95,
        status: 'Active',
        description: '500HP electric motor for conveyor system',
      },
    ]);
    console.log('Equipment created');

    // Create Maintenance Requests
    const requests = await MaintenanceRequest.create([
      {
        subject: 'Routine Inspection - Hydraulic Press',
        createdBy: users[4]._id,
        requestType: 'Preventive',
        equipment: equipment[0]._id,
        category: categories[0]._id,
        maintenanceTeam: teams[0]._id,
        technician: users[2]._id,
        priority: 'Normal',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        duration: 2,
        stage: 'New',
        notes: 'Regular monthly inspection required',
      },
      {
        subject: 'CNC Machine Calibration',
        createdBy: users[1]._id,
        requestType: 'Preventive',
        equipment: equipment[1]._id,
        category: categories[3]._id,
        maintenanceTeam: teams[0]._id,
        technician: users[3]._id,
        priority: 'High',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 4,
        stage: 'In Progress',
        notes: 'Precision calibration needed for upcoming production run',
      },
      {
        subject: 'HVAC Filter Replacement',
        createdBy: users[4]._id,
        requestType: 'Preventive',
        equipment: equipment[2]._id,
        category: categories[2]._id,
        maintenanceTeam: teams[2]._id,
        technician: users[3]._id,
        priority: 'Normal',
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        duration: 1,
        stage: 'New',
        notes: 'Quarterly filter replacement due',
      },
      {
        subject: 'Motor Overheating Issue',
        createdBy: users[4]._id,
        requestType: 'Corrective',
        equipment: equipment[3]._id,
        category: categories[1]._id,
        maintenanceTeam: teams[1]._id,
        technician: users[2]._id,
        priority: 'Urgent',
        scheduledDate: new Date(),
        duration: 6,
        stage: 'In Progress',
        notes: 'Motor temperature exceeding normal range. Immediate attention required.',
        instructions: 'Check cooling system, inspect bearings, verify electrical connections',
      },
      {
        subject: 'Completed - Press Maintenance',
        createdBy: users[1]._id,
        requestType: 'Preventive',
        equipment: equipment[0]._id,
        category: categories[0]._id,
        maintenanceTeam: teams[0]._id,
        technician: users[2]._id,
        priority: 'Normal',
        scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        duration: 3,
        stage: 'Repaired',
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Quarterly maintenance completed successfully',
      },
    ]);
    console.log('Maintenance requests created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Users Created:');
    console.log('Admin: admin@gearguard.com / Admin@123');
    console.log('Manager: manager@gearguard.com / Manager@123');
    console.log('Technician 1: tech1@gearguard.com / Tech@123');
    console.log('Technician 2: tech2@gearguard.com / Tech@123');
    console.log('Employee: emp1@gearguard.com / Emp@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
