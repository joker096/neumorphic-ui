const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove all existing imports by finding lines that start with 'import'
const lines = content.split('\n');
const filteredLines = lines.filter(function(line) {
  return line.indexOf('import ') !== 0;
});
content = filteredLines.join('\n');

// Create proper import statements
const components = [
  'CustomDiamondIcon', 'NeumorphicKnob', 'GlowingKnobLine', 'GlowingPlusLight',
  'LightPillButton', 'LightSearchBar', 'DarkPillButton', 'DarkSearchBar',
  'ActionCircleButton', 'PillButton', 'Dialpad', 'HubToggleIcon', 'RadialMenu',
  'AvatarRow', 'ChatListItem', 'ChatPreviewLayer', 'SettingsToggle',
  'VideoPlayerOverlay', 'NotificationMockup', 'StickerPicker'
];

const importStatements = components.map(function(name) {
  return 'import { ' + name + ' } from "./components/ui/' + name + '";';
}).join('\n');

// Add the imports at the beginning of the file
content = importStatements + '\n' + content;

fs.writeFileSync('src/App.tsx', content);
console.log('Successfully fixed imports');
