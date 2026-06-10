const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');

// Get all .ts files in the ui directory
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.ts'));

// Define which imports each component needs
const componentImports = {
  'CustomDiamondIcon.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'NeumorphicKnob.ts': {
    react: false,
    exports: true,
    additional: []
  },
  'GlowingKnobLine.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Plus']
  },
  'GlowingPlusLight.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Plus']
  },
  'LightPillButton.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'LightSearchBar.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Search']
  },
  'DarkPillButton.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'DarkSearchBar.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Search']
  },
  'ActionCircleButton.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'PillButton.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Plus', 'CheckCheck']
  },
  'Dialpad.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'Search', 'Users', 'Phone', 'X',
      'useAppStore', './store'
    ]
  },
  'HubToggleIcon.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'RadialMenu.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'X', 'CustomDiamondIcon',
      'motion', 'react',
      'useRef', 'useState', 'useEffect', 'React',
      './store', 'useAppStore',
      './components/ContactProfileModal', 'ContactProfileModal', './components/ContactProfile', 'ContactProfile',
      './components/PhotoViewer', 'PhotoViewerOverlay',
      './components/VoiceWaveform', 'VoiceWaveform',
      './components/FloatingCallWidget', 'FloatingCallWidget',
      './lib/cryptoCore', 'cryptoCore',
      'sonner', 'toast',
      'sonner', 'Toaster',
      './components/CreateChannelModal', 'CreateChannelModal',
      './components/CreateBotModal', 'CreateBotModal',
      './components/ChannelCommentsView', 'ChannelCommentsView'
    ]
  },
  'AvatarRow.ts': {
    react: true,
    exports: true,
    additional: ['lucide-react', 'Plus']
  },
  'ChatListItem.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'Archive', 'useAppStore', './store',
      './components/FormattedText', 'FormattedText'
    ]
  },
  'ChatPreviewLayer.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'Search', 'X', 'Phone', 'Bookmark', 'MoreVertical', 'Video',
      'useAppStore', './store',
      './components/PhotoViewer', 'PhotoViewerOverlay',
      './components/VoiceWaveform', 'VoiceWaveform',
      './components/FloatingCallWidget', 'FloatingCallWidget',
      './lib/cryptoCore', 'cryptoCore',
      'sonner', 'toast',
      './components/ContactProfileModal', 'ContactProfileModal', './components/ContactProfile', 'ContactProfile',
      './components/ChannelCommentsView', 'ChannelCommentsView'
    ]
  },
  'SettingsToggle.ts': {
    react: true,
    exports: true,
    additional: []
  },
  'VideoPlayerOverlay.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'X', 'Play', 'Volume2', 'Maximize2',
      'motion', 'react'
    ]
  },
  'NotificationMockup.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'X', 'Bell',
      'motion', 'react'
    ]
  },
  'StickerPicker.ts': {
    react: true,
    exports: true,
    additional: [
      'lucide-react', 'Search',
      'motion', 'react'
    ]
  }
};

// Process each file
files.forEach(file => {
  const filePath = path.join(uiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const config = componentImports[file];
  if (!config) {
    console.log(`Skipping ${file} - no import config`);
    return;
  }
  
  // Add React import if needed
  if (config.react && !content.includes('import React')) {
    content = 'import React from "react";\n' + content;
  }
  
  // Add export keyword if it's a component function
  content = content.replace(/^(const\s+(\w+)\s*=)/gm, 'export const $2 =');
  
  // Add additional imports if needed
  config.additional.forEach(item => {
    if (item.includes('lucide-react')) {
      if (!content.includes('import { ') || !content.includes('from "lucide-react"')) {
        const icons = item.split(',').filter(i => i.trim());
        const importStatement = `import { ${icons.join(', ')} } from "lucide-react";\n`;
        if (!content.includes('lucide-react')) {
          content = importStatement + '\n' + content;
        }
      }
    } else if (item.includes('motion')) {
      if (!content.includes('import { motion }')) {
        content = 'import { motion } from "motion/react";\n' + content;
      }
    } else if (item === 'react') {
      // Already handled above
    } else if (item.includes('./store') || item.includes('useAppStore')) {
      if (!content.includes("import { useAppStore }") && !content.includes("from './store'")) {
        content = "import { useAppStore } from './store';\n" + content;
      }
    } else if (item.includes('./lib/cryptoCore') || item.includes('cryptoCore')) {
      if (!content.includes('cryptoCore')) {
        content = "import { cryptoCore } from './lib/cryptoCore';\n" + content;
      }
    } else if (item.includes('sonner') && item.includes('toast')) {
      if (!content.includes('toast')) {
        content = "import { toast } from 'sonner';\n" + content;
      }
    } else if (item.includes('sonner') && item.includes('Toaster')) {
      if (!content.includes('Toaster')) {
        content = "import { Toaster } from 'sonner';\n" + content;
      }
    } else if (item.includes('PhotoViewerOverlay')) {
      if (!content.includes('PhotoViewerOverlay')) {
        content = "import { PhotoViewerOverlay } from '../PhotoViewer';\n" + content;
      }
    } else if (item.includes('VoiceWaveform')) {
      if (!content.includes('VoiceWaveform')) {
        content = "import { VoiceWaveform } from '../VoiceWaveform';\n" + content;
      }
    } else if (item.includes('FloatingCallWidget')) {
      if (!content.includes('FloatingCallWidget')) {
        content = "import { FloatingCallWidget } from '../FloatingCallWidget';\n" + content;
      }
    } else if (item.includes('ContactProfileModal') || item.includes('ContactProfile')) {
      if (!content.includes('ContactProfileModal')) {
        content = "import { ContactProfileModal, ContactProfile } from '../ContactProfileModal';\n" + content;
      }
    } else if (item.includes('FormattedText')) {
      if (!content.includes('FormattedText')) {
        content = "import { FormattedText } from '../FormattedText';\n" + content;
      }
    } else if (item.includes('CreateChannelModal')) {
      if (!content.includes('CreateChannelModal')) {
        content = "import { CreateChannelModal } from '../CreateChannelModal';\n" + content;
      }
    } else if (item.includes('CreateBotModal')) {
      if (!content.includes('CreateBotModal')) {
        content = "import { CreateBotModal } from '../CreateBotModal';\n" + content;
      }
    } else if (item.includes('ChannelCommentsView')) {
      if (!content.includes('ChannelCommentsView')) {
        content = "import { ChannelCommentsView } from '../ChannelCommentsView';\n" + content;
      }
    }
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
