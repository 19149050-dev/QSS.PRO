const fs = require('fs');
const files = [
  'src/app/(dashboard)/manage-teams/page.jsx', 
  'src/app/(dashboard)/materials/page.jsx', 
  'src/app/(dashboard)/page.jsx', 
  'src/app/(dashboard)/projects/page.jsx', 
  'src/app/(dashboard)/teams/page.jsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/^\uFFFD/, '');
  content = content.replace(/T\uFFFD NG \(Tất cả T\uFFFD" Đ\uFFFD"i\)/g, 'TỔNG (Tất cả Tổ Đội)');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
