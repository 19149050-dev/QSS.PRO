const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app');
files.forEach(file => {
  const contentUtf8 = fs.readFileSync(file, 'utf8');
  // If the file contains the double-encoded pattern for "TỔNG" or other Vietnamese chars
  // typical signature is "Tá»" which is the double-encoded 'ổ' or similar.
  if (contentUtf8.includes('Tá»')) {
    console.log('Fixing encoding for:', file);
    // The bytes on disk are UTF-8 bytes of the Windows-1252 string.
    // E.g., UTF-8 reads `Tá»`, meaning the file contains the UTF-8 encoding of `Tá»`.
    // We want to treat the characters of `contentUtf8` as bytes (latin1), 
    // and then decode those bytes as UTF-8.
    const restored = Buffer.from(contentUtf8, 'latin1').toString('utf8');
    fs.writeFileSync(file, restored, 'utf8');
  }
});
