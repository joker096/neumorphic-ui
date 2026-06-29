export const DEFAULT_EQ_PRESETS = [
   { name: "Flat", gains: [0, 0, 0, 0, 0], description: "Flat response" },
   { name: "Bass Boost", gains: [8, 5, 2, 0, 0], description: "Enhanced bass" },
   { name: "Treble Boost", gains: [0, 0, 2, 5, 8], description: "Enhanced highs" },
   { name: "Vocal", gains: [0, 3, 8, 5, 0], description: "Vocal clarity" },
   { name: "Rock", gains: [5, 2, 0, 3, 6], description: "Rock EQ curve" },
   { name: "Pop", gains: [3, 4, 1, 3, 4], description: "Pop music" },
   { name: "Jazz", gains: [4, 2, 0, 2, 4], description: "Jazz warmth" },
   { name: "Classical", gains: [6, 3, 1, 3, 6], description: "Wide dynamic range" },
   { name: "Phonograph", gains: [6, 4, 0, 2, -2], description: "Phonograph curve" },
   { name: "Bass Reduces Highs", gains: [-4, -2, 0, 2, 4], description: "Reduced bass and high" },
];

export interface EQPreset {
   name: string;
   gains: number[];
   description: string;
   userCreated?: boolean;
   id?: string;
}

export const loadEQPresets = (): EQPreset[] => {
   try {
      const saved = localStorage.getItem("eq_presets");
      if (saved) {
         const userPresets = JSON.parse(saved);
         return [...DEFAULT_EQ_PRESETS, ...userPresets];
      }
   } catch {
      console.warn("Failed to load EQ presets from localStorage");
   }
   return DEFAULT_EQ_PRESETS;
};

export const saveUserPreset = (preset: Omit<EQPreset, "id">) => {
   try {
      const saved = localStorage.getItem("eq_presets");
      let userPresets = saved ? JSON.parse(saved) : [];
      userPresets = [...userPresets, { ...preset, id: Date.now().toString() }];
      localStorage.setItem("eq_presets", JSON.stringify(userPresets));
      return true;
   } catch {
      console.warn("Failed to save EQ preset to localStorage");
      return false;
   }
};

export const deleteUserPreset = (id: string) => {
   try {
      const saved = localStorage.getItem("eq_presets");
      if (!saved) return false;
      const userPresets = JSON.parse(saved).filter((p: any) => p.id !== id);
      localStorage.setItem("eq_presets", JSON.stringify(userPresets));
      return true;
   } catch {
      console.warn("Failed to delete EQ preset from localStorage");
      return false;
   }
};

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.opus', '.aac', '.m4a', '.wma'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];

export const isAudioFile = (file: File) => {
   return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};

export const isVideoFile = (file: File) => {
   return file.type.startsWith('video/') || VIDEO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};

export const loadAudioFiles = async (files: FileList | File[] | FileSystemHandle[], onAdd: (file: File) => void) => {
   const audioFiles: File[] = [];
   for (const item of files) {
      if (item instanceof File) {
         if (isAudioFile(item)) {
            audioFiles.push(item);
         }
      } else if ('isDirectory' in item && item.isDirectory) {
         try {
            const entries = [];
            for await (const entry of (item as any).entries()) {
               entries.push(entry);
            }
            for (const entry of entries) {
               if ('isFile' in entry && entry.isFile && (entry as any).isFile) {
                  const file = await (entry as any).getFile();
                  if (file && isAudioFile(file)) {
                     audioFiles.push(file);
                  }
               }
            }
         } catch (e) {
            console.warn("Failed to read directory:", e);
         }
      }
   }
   audioFiles.forEach(onAdd);
   return audioFiles.length;
};

export const detectAudioOutputDevices = () => {
   try {
      return navigator.mediaDevices?.enumerateDevices().then((devices) => {
         return {
            audioOutput: devices.filter((d: MediaDeviceInfo) => d.kind === 'audiooutput'),
            audioInput: devices.filter((d: MediaDeviceInfo) => d.kind === 'audioinput'),
         };
      }).catch(() => ({ audioOutput: [], audioInput: [] })) as Promise<{ audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }>;
   } catch {
      return Promise.resolve({ audioOutput: [], audioInput: [] });
   }
};

export interface MediaDeviceInfo {
   deviceId: string;
   label: string;
   kind: string;
   groupId: string;
}