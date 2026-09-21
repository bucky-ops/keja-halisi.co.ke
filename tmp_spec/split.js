const fs = require('fs');
const src = fs.readFileSync('/home/z/my-project/upload/Keja-Halisi-Full-Product-V3-Merged.html','utf8');
const lines = src.split('\n');
// grab the big app-code line (original line 23, index 22) plus 22-25 context
const code = lines[22];
let out = '';
let indent = 0;
let i = 0;
let state = 'code'; // code | squote | dquote | tpl | linecomment | blockcomment | regex-ish(ignored)
const push = (ch) => { out += ch; };
while (i < code.length) {
  const ch = code[i], nx = code[i+1];
  if (state === 'code') {
    if (ch === "'" ) { state='squote'; push(ch); i++; continue; }
    if (ch === '"') { state='dquote'; push(ch); i++; continue; }
    if (ch === '`') { state='tpl'; push(ch); i++; continue; }
    if (ch === '/' && nx === '/') { state='linecomment'; push(ch); i++; continue; }
    if (ch === '/' && nx === '*') { state='blockcomment'; push(ch); i++; continue; }
    if (ch === '{') { push(ch); indent++; out+='\n'+'  '.repeat(indent); i++; continue; }
    if (ch === '}') { indent=Math.max(0,indent-1); out+='\n'+'  '.repeat(indent); push(ch); if(nx!==','&&nx!==')'&&nx!==';'&&nx!=='}'&&nx!==' '&&nx!=='.'){out+='\n'+'  '.repeat(indent);} i++; continue; }
    if (ch === ';') { push(ch); out+='\n'+'  '.repeat(indent); i++; continue; }
    push(ch); i++; continue;
  }
  if (state === 'squote' || state === 'dquote') {
    if (ch === '\\') { push(ch); push(nx); i+=2; continue; }
    if ((state==='squote'&&ch==="'")||(state==='dquote'&&ch==='"')) state='code';
    push(ch); i++; continue;
  }
  if (state === 'tpl') {
    if (ch === '\\') { push(ch); push(nx); i+=2; continue; }
    if (ch === '`') { state='code'; push(ch); i++; continue; }
    push(ch); i++; continue;
  }
  if (state === 'linecomment') { if (ch==='\n'){state='code';} push(ch); i++; continue; }
  if (state === 'blockcomment') { if (ch==='*'&&nx==='/'){state='code';} push(ch); i++; continue; }
}
fs.writeFileSync('/home/z/my-project/tmp_spec/app_code.txt', out);
console.log('lines:', out.split('\n').length);
