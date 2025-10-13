const fs = require('fs');
const path = require('path');

// Function to fix all import issues
function fixAllImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix incorrect ./ui/ imports in UI components
    const incorrectUIImportRegex = /from ["']\.\/ui\/([^"']+)["']/g;
    content = content.replace(incorrectUIImportRegex, (match, component) => {
      modified = true;
      return `from "./${component}"`;
    });

    // Fix incorrect ../lib/utils imports in UI components
    const incorrectLibImportRegex = /from ["']\.\.\/lib\/utils["']/g;
    if (filePath.includes('components/ui/')) {
      content = content.replace(incorrectLibImportRegex, () => {
        modified = true;
        return `from "../../lib/utils"`;
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

    if (stat.isDirectory()) {
      fixedCount += fixAllFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixAllImports(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Main execution
console.log('🔧 Starting comprehensive import fixes...');
const projectRoot = path.join(__dirname, '..');
const fixedCount = fixAllFiles(projectRoot);
console.log(`🎉 Fixed imports in ${fixedCount} files!`);
