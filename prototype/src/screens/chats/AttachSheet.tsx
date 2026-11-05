import { Camera, FileText, Image as ImageIcon, MapPin, Mic, User } from 'lucide-react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import styles from './AttachSheet.module.css';

interface AttachSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (src: string) => void;
}

const ITEMS = [
  { id: 'document', label: 'Document', icon: FileText, color: '#F97316' },
  { id: 'camera', label: 'Camera', icon: Camera, color: '#14B8A6' },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon, color: '#A855F7' },
  { id: 'audio', label: 'Audio', icon: Mic, color: '#06B6D4' },
  { id: 'location', label: 'Location', icon: MapPin, color: '#EF4444' },
  { id: 'contact', label: 'Contact', icon: User, color: '#3B82F6' },
];

export function AttachSheet({ open, onClose, onPick }: AttachSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} compact title="Attach">
      <div className={styles.grid}>
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={styles.cell}
              onClick={() => {
                if (item.id === 'gallery') onPick('https://picsum.photos/seed/hichat-attach/600/400');
                onClose();
              }}
            >
              <span className={styles.icon} style={{ background: item.color }}>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
