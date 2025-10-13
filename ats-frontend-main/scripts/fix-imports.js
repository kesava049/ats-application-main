const fs = require('fs');
const path = require('path');

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix @/components/ui/ imports to relative paths
    const uiImportRegex = /from ["']@\/components\/ui\/([^"']+)["']/g;
    content = content.replace(uiImportRegex, (match, component) => {
      modified = true;
      return `from "../../components/ui/${component}"`;
    });

    // Fix @/hooks/ imports to relative paths
    const hooksImportRegex = /from ["']@\/hooks\/([^"']+)["']/g;
    content = content.replace(hooksImportRegex, (match, hook) => {
      modified = true;
      return `from "../../hooks/${hook}"`;
    });

    // Fix @/lib/ imports to relative paths
    const libImportRegex = /from ["']@\/lib\/([^"']+)["']/g;
    content = content.replace(libImportRegex, (match, lib) => {
      modified = true;
      return `from "../../lib/${lib}"`;
    });

    // Fix @/PythonApi imports
    const pythonApiRegex = /from ["']@\/PythonApi["']/g;
    content = content.replace(pythonApiRegex, () => {
      modified = true;
      return `from "../../PythonApi"`;
    });

    // Fix @/BaseUrlApi imports
    const baseUrlApiRegex = /from ["']@\/BaseUrlApi["']/g;
    content = content.replace(baseUrlApiRegex, () => {
      modified = true;
      return `from "../../BaseUrlApi"`;
    });

    // Fix @/components/ imports (non-ui components)
    const componentsImportRegex = /from ["']@\/components\/([^"']+)["']/g;
    content = content.replace(componentsImportRegex, (match, component) => {
      modified = true;
      return `from "../../components/${component}"`;
    });

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

// Function to recursively find and fix all .tsx files in app/components
function fixAllImports(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += fixAllImports(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportsInFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Function to fix imports in a file with dynamic path calculation
function fixImportsInFileWithPath(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Calculate relative path to components directory
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'components'));
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Fix @/components/ui/ imports to relative paths
    const uiImportRegex = /from ["']@\/components\/ui\/([^"']+)["']/g;
    content = content.replace(uiImportRegex, (match, component) => {
      modified = true;
      return `from "${normalizedPath}/ui/${component}"`;
    });

    // Fix @/components/ imports (non-ui components)
    const componentsImportRegex = /from ["']@\/components\/([^"']+)["']/g;
    content = content.replace(componentsImportRegex, (match, component) => {
      modified = true;
      return `from "${normalizedPath}/${component}"`;
    });

    // Fix @/hooks/ imports to relative paths
    const hooksImportRegex = /from ["']@\/hooks\/([^"']+)["']/g;
    content = content.replace(hooksImportRegex, (match, hook) => {
      modified = true;
      const hooksPath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'hooks'));
      return `from "${hooksPath.replace(/\\/g, '/')}/${hook}"`;
    });

    // Fix @/lib/ imports to relative paths
    const libImportRegex = /from ["']@\/lib\/([^"']+)["']/g;
    content = content.replace(libImportRegex, (match, lib) => {
      modified = true;
      const libPath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'lib'));
      return `from "${libPath.replace(/\\/g, '/')}/${lib}"`;
    });

    // Fix @/PythonApi imports
    const pythonApiRegex = /from ["']@\/PythonApi["']/g;
    content = content.replace(pythonApiRegex, () => {
      modified = true;
      const apiPath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'PythonApi'));
      return `from "${apiPath.replace(/\\/g, '/')}"`;
    });

    // Fix @/BaseUrlApi imports
    const baseUrlApiRegex = /from ["']@\/BaseUrlApi["']/g;
    content = content.replace(baseUrlApiRegex, () => {
      modified = true;
      const apiPath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'BaseUrlApi'));
      return `from "${apiPath.replace(/\\/g, '/')}"`;
    });

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

// Function to recursively find and fix all .tsx files in app directory
function fixAllImportsInApp(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += fixAllImportsInApp(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportsInFileWithPath(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Function to fix imports in components directory files
function fixImportsInComponentsFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if this is a UI component file
    const isUIComponent = filePath.includes('components/ui/');
    
    if (isUIComponent) {
      // For UI components, other UI components are in the same directory
      const uiImportRegex = /from ["']@\/components\/ui\/([^"']+)["']/g;
      content = content.replace(uiImportRegex, (match, component) => {
        modified = true;
        return `from "./${component}"`;
      });
    } else {
      // Calculate relative path to ui directory
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'components', 'ui'));
      const normalizedPath = relativePath.replace(/\\/g, '/');

      // For files in components/ directory, UI components are in relative path
      const uiImportRegex = /from ["']@\/components\/ui\/([^"']+)["']/g;
      content = content.replace(uiImportRegex, (match, component) => {
        modified = true;
        return `from "${normalizedPath}/${component}"`;
      });
    }

    // Fix @/hooks/ imports to relative paths
    const hooksImportRegex = /from ["']@\/hooks\/([^"']+)["']/g;
    content = content.replace(hooksImportRegex, (match, hook) => {
      modified = true;
      return `from "../hooks/${hook}"`;
    });

    // Fix @/lib/ imports to relative paths
    const libImportRegex = /from ["']@\/lib\/([^"']+)["']/g;
    content = content.replace(libImportRegex, (match, lib) => {
      modified = true;
      return `from "../lib/${lib}"`;
    });

    // Fix @/PythonApi imports
    const pythonApiRegex = /from ["']@\/PythonApi["']/g;
    content = content.replace(pythonApiRegex, () => {
      modified = true;
      return `from "../PythonApi"`;
    });

    // Fix @/BaseUrlApi imports
    const baseUrlApiRegex = /from ["']@\/BaseUrlApi["']/g;
    content = content.replace(baseUrlApiRegex, () => {
      modified = true;
      return `from "../BaseUrlApi"`;
    });

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

// Function to recursively find and fix all .tsx files in components directory
function fixAllImportsInComponents(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += fixAllImportsInComponents(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportsInComponentsFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Main execution
console.log('🔧 Starting import path fixes...');
const appDir = path.join(__dirname, '..', 'app');
const componentsDir = path.join(__dirname, '..', 'components');
const appFixedCount = fixAllImportsInApp(appDir);
const componentsFixedCount = fixAllImportsInComponents(componentsDir);
const totalFixed = appFixedCount + componentsFixedCount;
console.log(`🎉 Fixed imports in ${totalFixed} files! (App: ${appFixedCount}, Components: ${componentsFixedCount})`);
