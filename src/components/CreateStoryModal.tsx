import { useState, useRef } from 'react';
import { Sheet } from './ui/Sheet';
import { Camera, Image, X, Check } from 'lucide-react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (mediaUrl: string, caption: string) => void;
  isDark: boolean;
}

export function CreateStoryModal({ isOpen, onClose, onPost, isDark }: CreateStoryModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handlePost = () => {
    if (!preview) return;
    onPost(preview, caption);
    setPreview(null);
    setCaption('');
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="large">
      <div className="flex flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            New Story
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-slate-600 hover:bg-black/10'}`}
          >
            <X size={16} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black">
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full aspect-[9/16] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
              isDark
                ? 'border-white/20 hover:border-white/40 bg-white/5'
                : 'border-black/20 hover:border-black/40 bg-black/5'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <Image size={32} className={isDark ? 'text-gray-400' : 'text-slate-400'} />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Tap to add photo or video
            </span>
          </div>
        )}

        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className={`w-full px-4 py-3 rounded-xl text-sm outline-none ${
            isDark
              ? 'bg-[#1C1C1E] text-white border border-white/10'
              : 'bg-white text-slate-800 border border-black/10'
          }`}
        />

        <button
          onClick={handlePost}
          disabled={!preview}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            !preview
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <Camera size={18} />
          Post Story
        </button>
      </div>
    </Sheet>
  );
}
