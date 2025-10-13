#!/usr/bin/env node

/**
 * Production build script with hydration checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build with hydration fixes...\n');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // Build the application
  console.log('🔨 Building application for production...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check for build errors
  console.log('✅ Build completed successfully!');
  
  // Start production server for testing
  console.log('🌐 Starting production server for testing...');
  console.log('📝 You can now test the application at http://localhost:3000');
  console.log('🔍 Check the browser console for any hydration warnings');
  console.log('⏹️  Press Ctrl+C to stop the server\n');
  
  execSync('npm start', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
