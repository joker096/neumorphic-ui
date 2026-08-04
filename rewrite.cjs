const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const appIndex = content.indexOf('export default function App() {');
if (appIndex !== -1) {
  let topContent = content.substring(0, appIndex);
  
  const importsText = `
import { MeshRadar } from "./components/MeshRadar";
import { MorseDecoder, encodeMorse, isMorseCode } from "./components/MorseDecoder";
`;
  
  const firstImportMatch = topContent.indexOf('import');
  if (firstImportMatch !== -1) {
    topContent = topContent.slice(0, firstImportMatch) + importsText + topContent.slice(firstImportMatch);
  }
  
  const newAppSrc = fs.readFileSync('newApp.txt', 'utf8');
  fs.writeFileSync('src/App.tsx', topContent + newAppSrc, 'utf8');
  console.log("Success");
}
