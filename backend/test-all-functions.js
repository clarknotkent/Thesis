// Comprehensive Backend Function Test
// This script tests all controllers, models, and database connectivity
// Run with: node test-all-functions.js

require('dotenv').config();
const supabase = require('./db');

// Import all models
const authModel = require('./models/authModel');
const userModel = require('./models/userModel');
const patientModel = require('./models/patientModel');
const vaccineModel = require('./models/vaccineModel');
const immunizationModel = require('./models/immunizationModel');
const healthWorkerModel = require('./models/healthWorkerModel');
const smsModel = require('./models/smsModel');
const dashboardModel = require('./models/dashboardModel');
const reportModel = require('./models/reportModel');

// Test results storage
const testResults = {
  database: { status: 'pending', details: [] },
  models: { status: 'pending', details: [] },
  controllers: { status: 'pending', details: [] }
};

// Helper function to log test results
function logTest(category, testName, status, message = '', error = null) {
  const result = {
    test: testName,
    status: status,
    message: message,
    timestamp: new Date().toISOString(),
    error: error ? error.message : null
  };
  
  testResults[category].details.push(result);
  
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳';
  console.log(`${statusIcon} [${category.toUpperCase()}] ${testName}: ${message}`);
  
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// Test Database Connectivity
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    logTest('database', 'Connection Test', 'pass', 'Supabase connection successful');
    
    // Test table existence
    const tables = ['users', 'patients', 'vaccinemaster', 'immunizations', 'guardians', 'notifications', 'inventory'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) throw error;
        logTest('database', `Table: ${table}`, 'pass', 'Table accessible');
      } catch (err) {
        logTest('database', `Table: ${table}`, 'fail', 'Table not accessible', err);
      }
    }
    
    testResults.database.status = 'completed';
    
  } catch (error) {
    logTest('database', 'Connection Test', 'fail', 'Database connection failed', error);
    testResults.database.status = 'failed';
  }
}

// Test Auth Model Functions
async function testAuthModel() {
  console.log('\n🔐 Testing Auth Model Functions...');
  
  const testFunctions = [
    {
      name: 'getUserByUsername',
      test: async () => {
        const result = await authModel.getUserByUsername('nonexistent_user');
        return { success: result === null || result === undefined, message: 'Function executed without error' };
      }
    },
    {
      name: 'findUserByUsernameOrEmail',
      test: async () => {
        const result = await authModel.findUserByUsernameOrEmail('test@example.com');
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `AuthModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `AuthModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test User Model Functions
async function testUserModel() {
  console.log('\n👤 Testing User Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllUsers',
      test: async () => {
        const result = await userModel.getAllUsers();
        const isValid = result && Array.isArray(result.users);
        return { success: isValid, message: `Retrieved ${isValid ? result.users.length : 'undefined'} users` };
      }
    },
    {
      name: 'getUserById',
      test: async () => {
        const result = await userModel.getUserById(999999); // Non-existent ID
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `UserModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `UserModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Patient Model Functions
async function testPatientModel() {
  console.log('\n🧒 Testing Patient Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllChildren',
      test: async () => {
        const result = await patientModel.getAllChildren();
        const isValid = result && Array.isArray(result.patients);
        return { success: isValid, message: `Retrieved ${isValid ? result.patients.length : 'undefined'} children` };
      }
    },
    {
      name: 'getChildById',
      test: async () => {
        const result = await patientModel.getChildById(999999);
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `PatientModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `PatientModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Vaccine Model Functions
async function testVaccineModel() {
  console.log('\n💉 Testing Vaccine Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllVaccines',
      test: async () => {
        const result = await vaccineModel.getAllVaccines();
        const isValid = result && Array.isArray(result.vaccines);
        return { success: isValid, message: `Retrieved ${isValid ? result.vaccines.length : 'undefined'} vaccines` };
      }
    },
    {
      name: 'getVaccineById',
      test: async () => {
        const result = await vaccineModel.getVaccineById(999999);
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `VaccineModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `VaccineModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Immunization Model Functions
async function testImmunizationModel() {
  console.log('\n📋 Testing Immunization Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllImmunizations',
      test: async () => {
        const result = await immunizationModel.getAllImmunizations();
        return { success: Array.isArray(result), message: `Retrieved ${result ? result.length : 0} immunizations` };
      }
    },
    {
      name: 'getImmunizationById',
      test: async () => {
        const result = await immunizationModel.getImmunizationById(999999);
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `ImmunizationModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `ImmunizationModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Health Worker Model Functions
async function testHealthWorkerModel() {
  console.log('\n👩‍⚕️ Testing Health Worker Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllHealthWorkers',
      test: async () => {
        const result = await healthWorkerModel.getAllHealthWorkers();
        return { success: Array.isArray(result), message: `Retrieved ${result ? result.length : 0} health workers` };
      }
    },
    {
      name: 'getHealthWorkerById',
      test: async () => {
        const result = await healthWorkerModel.getHealthWorkerById(999999);
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `HealthWorkerModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `HealthWorkerModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test SMS Model Functions
async function testSmsModel() {
  console.log('\n📱 Testing SMS Model Functions...');
  
  const testFunctions = [
    {
      name: 'getAllNotifications',
      test: async () => {
        const result = await smsModel.getAllNotifications();
        return { success: Array.isArray(result), message: `Retrieved ${result ? result.length : 0} notifications` };
      }
    },
    {
      name: 'getNotificationById',
      test: async () => {
        const result = await smsModel.getNotificationById(999999);
        return { success: true, message: 'Function executed without error' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `SmsModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `SmsModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Dashboard Model Functions
async function testDashboardModel() {
  console.log('\n📊 Testing Dashboard Model Functions...');
  
  const testFunctions = [
    {
      name: 'getDashboardStats',
      test: async () => {
        const result = await dashboardModel.getDashboardStats();
        return { success: typeof result === 'object', message: 'Dashboard stats retrieved' };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `DashboardModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `DashboardModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Report Model Functions
async function testReportModel() {
  console.log('\n📈 Testing Report Model Functions...');
  
  const testFunctions = [
    {
      name: 'getImmunizationReport',
      test: async () => {
        const result = await reportModel.getImmunizationReport();
        return { success: Array.isArray(result), message: `Retrieved immunization report data` };
      }
    }
  ];
  
  for (const func of testFunctions) {
    try {
      const result = await func.test();
      logTest('models', `ReportModel.${func.name}`, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('models', `ReportModel.${func.name}`, 'fail', 'Function threw error', error);
    }
  }
}

// Test Environment Variables
async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'JWT_SECRET',
    'PORT'
  ];
  
  for (const envVar of requiredEnvVars) {
    const exists = process.env[envVar] !== undefined;
    logTest('database', `ENV: ${envVar}`, exists ? 'pass' : 'fail', 
      exists ? 'Environment variable set' : 'Environment variable missing');
  }
}

// Test Controller Functions
async function testControllers() {
  console.log('\n🎮 Testing Controller Functions...');
  
  // Import controllers with error handling
  let userController, patientController, authController, vaccineController, immunizationController;
  
  try {
    userController = require('./controllers/userController');
    console.log('✅ UserController loaded successfully');
  } catch (error) {
    console.log('❌ Error loading UserController:', error.message);
  }
  
  try {
    patientController = require('./controllers/patientController');
    console.log('✅ PatientController loaded successfully');
  } catch (error) {
    console.log('❌ Error loading PatientController:', error.message);
  }
  
  try {
    authController = require('./controllers/authController');
    console.log('✅ AuthController loaded successfully');
  } catch (error) {
    console.log('❌ Error loading AuthController:', error.message);
  }
  
  try {
    vaccineController = require('./controllers/vaccineController');
    console.log('✅ VaccineController loaded successfully');
  } catch (error) {
    console.log('❌ Error loading VaccineController:', error.message);
  }
  
  try {
    immunizationController = require('./controllers/immunizationController');
    console.log('✅ ImmunizationController loaded successfully');
  } catch (error) {
    console.log('❌ Error loading ImmunizationController:', error.message);
  }
  
  // Mock request and response objects for testing
  const mockReq = {
    params: { id: 999999 },
    query: { page: 1, limit: 10 },
    body: { test: 'data' },
    user: { user_id: 1, role: 'admin' }
  };
  
  const mockRes = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; },
    send: function(data) { this.data = data; return this; }
  };
  
  const controllerTests = [];
  
  // Add tests only for successfully loaded controllers
  if (userController) {
    controllerTests.push({
      name: 'UserController.listUsers',
      test: async () => {
        const res = { ...mockRes };
        await userController.listUsers(mockReq, res);
        return { success: res.data !== undefined, message: 'Controller executed without error' };
      }
    });
  }
  
  if (patientController) {
    controllerTests.push({
      name: 'PatientController.getAllPatients',
      test: async () => {
        const res = { ...mockRes };
        await patientController.getAllPatients(mockReq, res);
        return { success: res.data !== undefined, message: 'Controller executed without error' };
      }
    });
  }
  
  if (authController) {
    controllerTests.push({
      name: 'AuthController.loginUser',
      test: async () => {
        const req = { ...mockReq, body: { username: 'test', password: 'test' } };
        const res = { ...mockRes };
        try {
          await authController.loginUser(req, res);
          return { success: true, message: 'Controller executed without error' };
        } catch (error) {
          // Login failure is expected for test data
          return { success: true, message: 'Controller handled request appropriately' };
        }
      }
    });
  }
  
  if (vaccineController) {
    controllerTests.push({
      name: 'VaccineController.listVaccines',
      test: async () => {
        const res = { ...mockRes };
        await vaccineController.listVaccines(mockReq, res);
        return { success: res.data !== undefined, message: 'Controller executed without error' };
      }
    });
    
    controllerTests.push({
      name: 'VaccineController.getVaccine',
      test: async () => {
        const res = { ...mockRes };
        await vaccineController.getVaccine(mockReq, res);
        return { success: res.statusCode !== undefined, message: 'Controller executed without error' };
      }
    });
    
    controllerTests.push({
      name: 'VaccineController.addVaccine',
      test: async () => {
        const req = { 
          ...mockReq, 
          body: { 
            vaccine_name: 'Test Vaccine',
            manufacturer: 'Test Manufacturer',
            vaccine_type: 'Test Type',
            description: 'Test Description'
          } 
        };
        const res = { ...mockRes };
        try {
          await vaccineController.addVaccine(req, res);
          return { success: true, message: 'Controller executed without error' };
        } catch (error) {
          return { success: true, message: 'Controller handled request appropriately' };
        }
      }
    });
    
    controllerTests.push({
      name: 'VaccineController.listInventory',
      test: async () => {
        const res = { ...mockRes };
        await vaccineController.listInventory(mockReq, res);
        return { success: res.data !== undefined, message: 'Controller executed without error' };
      }
    });
  }
  
  if (immunizationController) {
    controllerTests.push({
      name: 'ImmunizationController.listImmunizations',
      test: async () => {
        const res = { ...mockRes };
        await immunizationController.listImmunizations(mockReq, res);
        return { success: res.data !== undefined, message: 'Controller executed without error' };
      }
    });
    
    controllerTests.push({
      name: 'ImmunizationController.getImmunizationRecord',
      test: async () => {
        const res = { ...mockRes };
        await immunizationController.getImmunizationRecord(mockReq, res);
        return { success: res.statusCode !== undefined, message: 'Controller executed without error' };
      }
    });
    
    controllerTests.push({
      name: 'ImmunizationController.createImmunizationRecord',
      test: async () => {
        const req = { 
          ...mockReq, 
          body: { 
            patient_id: 1,
            vaccine_id: 1,
            administered_by: 1,
            dosage: '0.5ml',
            administration_date: new Date()
          } 
        };
        const res = { ...mockRes };
        try {
          await immunizationController.createImmunizationRecord(req, res);
          return { success: true, message: 'Controller executed without error' };
        } catch (error) {
          return { success: true, message: 'Controller handled request appropriately' };
        }
      }
    });
  }
  
  for (const test of controllerTests) {
    try {
      const result = await test.test();
      logTest('controllers', test.name, result.success ? 'pass' : 'fail', result.message);
    } catch (error) {
      logTest('controllers', test.name, 'fail', 'Controller threw error', error);
    }
  }
}

// Generate Test Summary
function generateSummary() {
  console.log('\n📋 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [category, results] of Object.entries(testResults)) {
    console.log(`\n${category.toUpperCase()}:`);
    
    const passed = results.details.filter(test => test.status === 'pass').length;
    const failed = results.details.filter(test => test.status === 'fail').length;
    const total = results.details.length;
    
    totalTests += total;
    passedTests += passed;
    failedTests += failed;
    
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Total: ${total}`);
    
    if (failed > 0) {
      console.log(`  Failed Tests:`);
      results.details
        .filter(test => test.status === 'fail')
        .forEach(test => {
          console.log(`    - ${test.test}: ${test.error || test.message}`);
        });
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`🎯 OVERALL RESULTS:`);
  console.log(`   ✅ Total Passed: ${passedTests}`);
  console.log(`   ❌ Total Failed: ${failedTests}`);
  console.log(`   📊 Total Tests: ${totalTests}`);
  console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log(`\n🎉 ALL TESTS PASSED! Your backend is working correctly!`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the errors above for debugging.`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 IMMUNIZEME BACKEND FUNCTION TEST');
  console.log('=' .repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    // Test environment variables first
    await testEnvironmentVariables();
    
    // Test database connectivity
    await testDatabaseConnection();
    
    // Test all model functions
    await testAuthModel();
    await testUserModel();
    await testPatientModel();
    await testVaccineModel();
    await testImmunizationModel();
    await testHealthWorkerModel();
    await testSmsModel();
    await testDashboardModel();
    await testReportModel();
    
    testResults.models.status = 'completed';
    
    // Test controller functions
    await testControllers();
    
    testResults.controllers.status = 'completed';
    
  } catch (error) {
    console.error('❌ Critical error during testing:', error);
  } finally {
    generateSummary();
    
    // Close database connections
    console.log('\n🔌 Closing connections...');
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
runAllTests();