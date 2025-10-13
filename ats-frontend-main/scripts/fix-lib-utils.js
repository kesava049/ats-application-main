const fs = require('fs');
const path = require('path');

// Function to fix lib/utils imports in UI components
function fixLibUtilsImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

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
      console.log(`✅ Fixed lib/utils import in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing lib/utils import in ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix all .tsx files in components/ui
function fixAllUIFiles(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += fixAllUIFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixLibUtilsImports(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Main execution
console.log('🔧 Starting lib/utils import fixes...');
const uiDir = path.join(__dirname, '..', 'components', 'ui');
const fixedCount = fixAllUIFiles(uiDir);
console.log(`🎉 Fixed lib/utils imports in ${fixedCount} files!`);
