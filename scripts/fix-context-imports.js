const fs = require('fs');
const path = require('path');

function findTSFiles(directory, fileList = []) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules') {
        findTSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function fixImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix various import patterns for context -> contexts
    const originalContent = content;
    
    // Fix single quotes
    content = content.replace(/from\s+'\.\.\/context\//g, "from '../contexts/");
    content = content.replace(/from\s+'\.\.\/\.\.\/context\//g, "from '../../contexts/");
    content = content.replace(/from\s+'\.\.\/\.\.\/\.\.\/context\//g, "from '../../../contexts/");
    
    // Fix double quotes
    content = content.replace(/from\s+"\.\.\/context\//g, 'from "../contexts/');
    content = content.replace(/from\s+"\.\.\/\.\.\/context\//g, 'from "../../contexts/');
    content = content.replace(/from\s+"\.\.\/\.\.\/\.\.\/context\//g, 'from "../../../contexts/');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Start from the src directory
const tsFiles = findTSFiles(path.join(__dirname, '../src'));
console.log(`Found ${tsFiles.length} TypeScript files to check.`);

// Fix each file
tsFiles.forEach(fixImports);
console.log('Done!'); 