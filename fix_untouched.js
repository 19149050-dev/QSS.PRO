const fs = require('fs');
const path = require('path');

const cp1252 = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138, 8249: 139, 338: 140, 381: 142, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159 };
function decodeCP1252(str) {
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code > 255) {
      if (cp1252[code] !== undefined) {
        bytes.push(cp1252[code]);
      } else {
        bytes.push(code % 256);
      }
    } else {
      bytes.push(code);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

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
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Ã') || content.includes('á»') || content.includes('Ã¡') || content.includes('Ä')) {
    console.log('Restoring double-encoded file:', file);
    const restored = decodeCP1252(content);
    fs.writeFileSync(file, restored, 'utf8');
  }
});
