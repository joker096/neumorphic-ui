import {
  Ban,
  BellOff,
  Download,
  Eraser,
  Image as ImageIcon,
  Repeat2,
  Search,
  Star,
  Timer,
} from 'lucide-react';
import type { DropdownItem } from '../../components/ui/DropdownMenu';

export const chatMenuItems: DropdownItem[] = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'mute', label: 'Mute Notification', icon: BellOff },
  { id: 'disappearing', label: 'Disappearing Messages', icon: Timer },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon },
  { id: 'starred', label: 'Starred Messages', icon: Star },
  { id: 'shortcut', label: 'Add Shortcut', icon: Repeat2 },
  { id: 'export', label: 'Export Chat', icon: Download },
  { id: 'clear', label: 'Clear Chat', icon: Eraser, danger: true },
  { id: 'block', label: 'Block', icon: Ban, danger: true },
];
