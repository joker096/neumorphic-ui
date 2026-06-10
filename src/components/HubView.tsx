import React from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { Plus, X, Search, CheckCheck, Mic, MicOff, BellOff, Settings, MessageCircle, Bell, Phone, Bookmark, Archive, Users, Megaphone, Shield, Target, Cloud, Globe, Activity, Eye, User, Star, Trash2, UserPlus, PhoneForwarded, Moon, Battery, Volume1, Volume2, VolumeX, ChevronRight, Check, ChevronDown, Play, Video, Music, Pause, SkipBack, SkipForward, Minimize2, Maximize2, FolderPlus, FilePlus, ListMusic, List, PhoneIncoming, PhoneOutgoing, PhoneMissed, Sun, QrCode, Scan, MoreVertical, Hash, Bot, Clock, Lock, ListFilter, Smile } from "lucide-react";
import { MeshRadar } from "./MeshRadar";
import { SystemPulsePlayer } from "./SystemPulsePlayer";
import { ContactProfileModal, ContactProfile } from "./ContactProfileModal";
import { MorseDecoder, encodeMorse, isMorseCode } from "./MorseDecoder";
import { PhotoViewerOverlay } from "./PhotoViewer";
import { VoiceWaveform } from "./VoiceWaveform";
import { FloatingCallWidget } from "./FloatingCallWidget";
import { useAppStore } from "../store";
import { useI18n } from '../lib/i18n';
import { cryptoCore } from "../lib/crypto/cryptoCore";
import { toast } from "sonner";

// Hub View - Contains RadialMenu and all hub-related components
export const HubView = () => {
  const { t } = useI18n();
  const [isDark, setIsDark] = React.useState(true);
  const [volume, setVolume] = React.useState(65);
  const [dnd, setDnd] = React.useState(false);
  const [proxy, setProxy] = React.useState(true);
  const [energy, setEnergy] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<ContactProfile | null>(null);
  const [showContactPicker, setShowContactPicker] = React.useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* RadialMenu would go here */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">{t('hub.placeholder')}</p>
      </div>
      
      <ContactProfileModal 
        contact={selectedContact}
        theme={isDark ? "dark" : "light"}
        onClose={() => setSelectedContact(null)}
        onCall={() => {
          toast.info("Call", { description: "Call functionality" });
          setSelectedContact(null);
        }}
        onMessage={() => {
          toast.info("Message", { description: "Message functionality" });
          setSelectedContact(null);
        }}
      />
    </div>
  );
};

export default HubView;
