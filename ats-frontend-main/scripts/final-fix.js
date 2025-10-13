const fs = require('fs');
const path = require('path');

// Function to fix all remaining import issues
function fixAllRemainingImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix ../lib/utils imports in UI components
    if (filePath.includes('components/ui/')) {
      const libUtilsRegex = /from ["']\.\.\/lib\/utils["']/g;
      content = content.replace(libUtilsRegex, () => {
        modified = true;
        return `from "../../lib/utils"`;
      });
    }

    // Fix ./select imports in components (not UI)
    if (filePath.includes('components/') && !filePath.includes('components/ui/')) {
      const selectRegex = /from ["']\.\/select["']/g;
      content = content.replace(selectRegex, () => {
        modified = true;
        return `from "./ui/select"`;
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix all .tsx files
function fixAllFiles(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fixedCount += fixAllFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixAllRemainingImports(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Main execution
console.log('🔧 Starting final import fixes...');
const projectRoot = path.join(__dirname, '..');
const fixedCount = fixAllFiles(projectRoot);
console.log(`🎉 Fixed imports in ${fixedCount} files!`);
