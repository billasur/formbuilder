const fs = require('fs');
const path = require('path');

function findCSSFiles(directory, fileList = []) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findCSSFiles(filePath, fileList);
    } else if (file.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function fixCSSFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove any @import statements for tailwindcss
    const originalContent = content;
    content = content.replace(/@import\s+["']tailwindcss["'];?\s*/g, '');
    content = content.replace(/@import\s+tailwindcss;?\s*/g, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Start from the src directory
const cssFiles = findCSSFiles(path.join(__dirname, '../src'));
console.log(`Found ${cssFiles.length} CSS files to check.`);

// Fix each CSS file
cssFiles.forEach(fixCSSFile);
console.log('Done!'); 