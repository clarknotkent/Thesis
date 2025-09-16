// Route-Controller-Model Audit Tool
// This script audits all controllers, models, and routes to ensure consistency
// Run with: node audit-routes-controllers.js

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, ...args) => {
  console.log(color, ...args, colors.reset);
};

// Extract function names from controller files
function extractControllerFunctions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract exported functions from module.exports - handle multi-line exports
    const moduleExportsMatch = content.match(/module\.exports\s*=\s*{([\s\S]*?)};?\s*$/);
    if (!moduleExportsMatch) return [];
    
    const exportsContent = moduleExportsMatch[1];
    const functionNames = exportsContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .split(',')
      .map(line => line.trim())
      .filter(line => line && line !== '')
      .map(line => line.replace(/[,\s\n\r]/g, ''))
      .filter(name => name.length > 0 && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name));
    
    return functionNames;
  } catch (error) {
    log(colors.red, `Error reading controller ${filePath}:`, error.message);
    return [];
  }
}

// Extract route definitions from route files
function extractRouteEndpoints(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract router method calls
    const routeMatches = content.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g);
    if (!routeMatches) return [];
    
    const routes = routeMatches.map(match => {
      const parts = match.match(/router\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/);
      if (parts) {
        return {
          method: parts[1].toUpperCase(),
          path: parts[2],
          handler: parts[3].trim().split(',').pop().trim()
        };
      }
      return null;
    }).filter(Boolean);
    
    return routes;
  } catch (error) {
    log(colors.red, `Error reading route ${filePath}:`, error.message);
    return [];
  }
}

// Extract model functions
function extractModelFunctions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for object method functions (e.g., functionName: async (...) => {)
    const objectMethodMatches = content.match(/(\w+)\s*:\s*async\s*\(/g) || [];
    const objectMethods = objectMethodMatches.map(match => {
      const nameMatch = match.match(/(\w+)\s*:/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean);
    
    // Look for regular const functions
    const functionMatches = content.match(/^const\s+(\w+)\s*=\s*(async\s+)?\(/gm) || [];
    const constFunctions = functionMatches.map(match => {
      const nameMatch = match.match(/const\s+(\w+)\s*=/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean);
    
    // Also check module.exports object
    const moduleExportsMatch = content.match(/module\.exports\s*=\s*{([^}]+)}/s);
    let exportedFunctions = [];
    if (moduleExportsMatch) {
      const exportsContent = moduleExportsMatch[1];
      exportedFunctions = exportsContent
        .split(',')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => {
          const match = line.match(/(\w+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    }
      
    return [...new Set([...objectMethods, ...constFunctions, ...exportedFunctions])];
  } catch (error) {
    log(colors.red, `Error reading model ${filePath}:`, error.message);
    return [];
  }
}

// Main audit function
function auditBackend() {
  log(colors.cyan, '\n🔍 BACKEND ROUTE-CONTROLLER-MODEL AUDIT');
  log(colors.cyan, '=' .repeat(60));
  
  const backendDir = path.join(__dirname);
  const controllersDir = path.join(backendDir, 'controllers');
  const routesDir = path.join(backendDir, 'routes');
  const modelsDir = path.join(backendDir, 'models');
  
  const auditResults = {};
  
  // Get all controller files
  const controllerFiles = fs.readdirSync(controllersDir)
    .filter(file => file.endsWith('Controller.js'))
    .map(file => ({
      name: file.replace('Controller.js', ''),
      file: file,
      path: path.join(controllersDir, file)
    }));
  
  // Get all route files
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('Routes.js'))
    .map(file => ({
      name: file.replace('Routes.js', ''),
      file: file,
      path: path.join(routesDir, file)
    }));
  
  // Get all model files
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('Model.js'))
    .map(file => ({
      name: file.replace('Model.js', ''),
      file: file,
      path: path.join(modelsDir, file)
    }));
  
  log(colors.blue, '\n📋 FILES FOUND:');
  log(colors.blue, `Controllers: ${controllerFiles.length}`);
  log(colors.blue, `Routes: ${routeFiles.length}`);
  log(colors.blue, `Models: ${modelFiles.length}\n`);
  
  // Audit each module
  for (const controller of controllerFiles) {
    const moduleName = controller.name;
    auditResults[moduleName] = {
      controller: {
        exists: true,
        functions: extractControllerFunctions(controller.path)
      },
      routes: {
        exists: false,
        endpoints: []
      },
      model: {
        exists: false,
        functions: []
      }
    };
    
    // Find corresponding route file
    const routeFile = routeFiles.find(r => r.name === moduleName);
    if (routeFile) {
      auditResults[moduleName].routes.exists = true;
      auditResults[moduleName].routes.endpoints = extractRouteEndpoints(routeFile.path);
    }
    
    // Find corresponding model file
    const modelFile = modelFiles.find(m => m.name === moduleName);
    if (modelFile) {
      auditResults[moduleName].model.exists = true;
      auditResults[moduleName].model.functions = extractModelFunctions(modelFile.path);
    }
  }
  
  // Generate audit report
  let totalIssues = 0;
  
  log(colors.magenta, '\n📊 AUDIT RESULTS:');
  log(colors.magenta, '=' .repeat(60));
  
  for (const [moduleName, audit] of Object.entries(auditResults)) {
    log(colors.yellow, `\n🔧 MODULE: ${moduleName.toUpperCase()}`);
    
    // Controller status
    if (audit.controller.exists) {
      log(colors.green, `  ✅ Controller: ${audit.controller.functions.length} functions`);
      audit.controller.functions.forEach(func => {
        log(colors.green, `     - ${func}`);
      });
    } else {
      log(colors.red, `  ❌ Controller: Missing`);
      totalIssues++;
    }
    
    // Routes status
    if (audit.routes.exists) {
      log(colors.green, `  ✅ Routes: ${audit.routes.endpoints.length} endpoints`);
      audit.routes.endpoints.forEach(route => {
        log(colors.green, `     - ${route.method} ${route.path} → ${route.handler}`);
      });
    } else {
      log(colors.red, `  ❌ Routes: Missing`);
      totalIssues++;
    }
    
    // Model status
    if (audit.model.exists) {
      log(colors.green, `  ✅ Model: ${audit.model.functions.length} functions`);
      audit.model.functions.forEach(func => {
        log(colors.green, `     - ${func}`);
      });
    } else {
      log(colors.red, `  ❌ Model: Missing`);
      totalIssues++;
    }
    
    // Check for mismatches
    if (audit.controller.exists && audit.routes.exists) {
      const controllerFunctions = audit.controller.functions;
      const routeHandlers = audit.routes.endpoints.map(r => r.handler);
      
      // Find unrouted controller functions
      const unroutedFunctions = controllerFunctions.filter(func => 
        !routeHandlers.includes(func)
      );
      
      // Find missing controller functions for routes
      const missingControllerFunctions = routeHandlers.filter(handler => 
        !controllerFunctions.includes(handler)
      );
      
      if (unroutedFunctions.length > 0) {
        log(colors.red, `  ⚠️  Unrouted Controller Functions:`);
        unroutedFunctions.forEach(func => {
          log(colors.red, `     - ${func}`);
        });
        totalIssues += unroutedFunctions.length;
      }
      
      if (missingControllerFunctions.length > 0) {
        log(colors.red, `  ⚠️  Missing Controller Functions:`);
        missingControllerFunctions.forEach(func => {
          log(colors.red, `     - ${func}`);
        });
        totalIssues += missingControllerFunctions.length;
      }
    }
  }
  
  // Summary
  log(colors.cyan, '\n📈 AUDIT SUMMARY');
  log(colors.cyan, '=' .repeat(60));
  
  if (totalIssues === 0) {
    log(colors.green, '🎉 ALL ROUTES AND CONTROLLERS ARE PROPERLY MAPPED!');
  } else {
    log(colors.red, `⚠️  FOUND ${totalIssues} ISSUES THAT NEED ATTENTION`);
  }
  
  log(colors.cyan, '\n🔧 NEXT STEPS:');
  if (totalIssues > 0) {
    log(colors.yellow, '1. Review the issues listed above');
    log(colors.yellow, '2. Add missing routes for unrouted controller functions');
    log(colors.yellow, '3. Implement missing controller functions for existing routes');
    log(colors.yellow, '4. Run the test-all-functions.js script after fixes');
  } else {
    log(colors.green, '1. Your backend structure is complete!');
    log(colors.green, '2. Ready to run test-all-functions.js');
  }
  
  return { auditResults, totalIssues };
}

// Run the audit
if (require.main === module) {
  auditResults = auditBackend();
}

module.exports = { auditBackend };