const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const index = appCode.indexOf('export default function App() {');
if (index !== -1) {
    let top = appCode.substring(0, index);    
    let newAppContent = fs.readFileSync('finalApp.txt', 'utf8');
    fs.writeFileSync('src/App.tsx', top + newAppContent, 'utf8');
    console.log("INJECTED");
}
