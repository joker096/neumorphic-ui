const fs = require('fs');

['src/components/MeshRadar.tsx', 'src/components/MorseDecoder.tsx', 'src/App.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove backslash before backticks
  content = content.replace(/\\\`/g, '\`');
  // Remove backslash before dollar signs
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Cleanup done");
