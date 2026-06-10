const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Find where the lucide-react import ends (after line 70)
const importEndIndex = content.indexOf('} from "lucide-react";');
if (importEndIndex === -1) {
  console.error('Could not find lucide-react import');
  process.exit(1);
}

// Create import statements for extracted components
const components = [
  'CustomDiamondIcon', 'NeumorphicKnob', 'GlowingKnobLine', 'GlowingPlusLight',
  'LightPillButton', 'LightSearchBar', 'DarkPillButton', 'DarkSearchBar',
  'ActionCircleButton', 'PillButton', 'Dialpad', 'HubToggleIcon', 'RadialMenu',
  'AvatarRow', 'ChatListItem', 'ChatPreviewLayer', 'SettingsToggle',
  'VideoPlayerOverlay', 'NotificationMockup', 'StickerPicker'
];

const importStatements = '\n' + components.map(function(name) {
  return 'import { ' + name + ' } from "./components/ui/' + name + '";';
}).join('\n') + '\n';

// Insert the imports after the lucide-react import
const lucideImportStatement = '} from "lucide-react";';
content = content.substring(0, importEndIndex) + lucideImportStatement + importStatements + content.substring(importEndIndex + lucideImportStatement.length);

// Now remove the inline component definitions (from line 72 to the end of all inline components)
// Find where the inline components end (before "// New Messenger App")
const inlineComponentsEnd = content.indexOf('// New Messenger App\n// New Messenger App\n// New Messenger App');
if (inlineComponentsEnd === -1) {
  console.error('Could not find end of inline components');
  process.exit(1);
}

// Find where inline components start (after the lucide-react import)
const inlineComponentsStart = content.indexOf('/**', importEndIndex);
if (inlineComponentsStart === -1) {
  console.error('Could not find start of inline components');
  process.exit(1);
}

// Remove the inline component definitions
content = content.substring(0, inlineComponentsStart) + content.substring(inlineComponentsEnd);

fs.writeFileSync('src/App.tsx', content);
console.log('Successfully updated App.tsx');
