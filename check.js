import fs from 'fs';
const content = fs.readFileSync('src/pages/DanhSachHopDong.jsx', 'utf8');
const lines = content.split('\n');
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let strChar = '';
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if ((c === '\'' || c === '"' || c === '`') && line[j-1] !== '\\') {
      if (!inString) { inString = true; strChar = c; }
      else if (c === strChar) { inString = false; }
    }
    if (!inString && c === '/' && line[j+1] === '*') {
      // Very naive block comment skip
    }
    if (!inString) {
      if (c === '{') stack.push(i + 1);
      if (c === '}') stack.pop();
    }
  }
}
console.log('Unclosed:', stack);
