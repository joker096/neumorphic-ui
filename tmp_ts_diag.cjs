const ts = require('typescript');
const p = 'src/App.tsx';
const src = ts.sys.readFile(p);
const f = ts.createSourceFile(p, src, ts.ScriptTarget.Latest, true);
function createHost(file) { return { file: p, sourceFile: file, getSourceFile: name => name === p ? file : undefined, writeFile: () => {}, getCurrentDirectory: () => '', getDirectories: () => [], fileExists: () => true, readFile: () => '', getCanonicalFileName: f => f, useCaseSensitiveFileNames: true, getNewLine: () => '\n' }; };
const diags = ts.getPreEmitDiagnostics(ts.createProgram([p], {}, createHost(f)));
for (const d of diags) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(msg, 'at', d.file ? d.file.fileName + ':' + (d.start ? ts.getLineAndCharacterOfPosition(d.file, d.start).line+1 : '?') : '?');
}