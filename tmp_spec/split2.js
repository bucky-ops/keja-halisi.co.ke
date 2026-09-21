const fs = require('fs');
const src = fs.readFileSync('/home/z/my-project/upload/Keja-Halisi-Full-Product-V3-Merged.html','utf8').split('\n');
const code = src[22].slice(7); // after the template-close + `}),` start... actually keep from `o("header"`
const start = src[22].indexOf('o("header"');
const c = src[22].slice(start);
let out = '';
let indent = 0;
let i = 0;
const stack = []; // for tpl interpolations
let state = 'code';
const NL = () => out += '\n' + '  '.repeat(Math.max(0,indent));
while (i < c.length) {
  const ch = c[i], nx = c[i+1];
  if (state === 'code') {
    if (ch === "'") { state='s'; out+=ch; i++; continue; }
    if (ch === '"') { state='d'; out+=ch; i++; continue; }
    if (ch === '`') { state='t'; out+=ch; i++; continue; }
    if (ch === '{') { out+=ch; indent++; NL(); i++; continue; }
    if (ch === '}') { indent=Math.max(0,indent-1); NL(); out+=ch; i++; continue; }
    if (ch === ';') { out+=ch; NL(); i++; continue; }
    out+=ch; i++; continue;
  }
  if (state === 's' || state === 'd') {
    if (ch === '\\') { out+=ch+nx; i+=2; continue; }
    if ((state==='s'&&ch==="'")||(state==='d'&&ch==='"')) state='code';
    out+=ch; i++; continue;
  }
  if (state === 't') {
    if (ch === '\\') { out+=ch+nx; i+=2; continue; }
    if (ch === '`') { state='code'; out+=ch; i++; continue; }
    if (ch === '$' && nx === '{') { stack.push('t'); state='code'; out+=ch+nx+'{'; i+=2; indent++; NL(); continue; }
    out+=ch; i++; continue;
  }
}
// also handle popping: when in code and we see '}' and stack top is 't', pop
// simpler: post-fix not needed for readability
fs.writeFileSync('/home/z/my-project/tmp_spec/app_code.txt', out);
console.log('lines:', out.split('\n').length, 'maxlen:', Math.max(...out.split('\n').map(l=>l.length)));
