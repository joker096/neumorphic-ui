import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, ChevronLeft } from 'lucide-react';
import { FormattedText } from './FormattedText';
import { messageEncryption } from '../lib/crypto/MessageEncryptionService';
import { p2pNetwork } from '../lib/p2p/network';
import { generatePostKey, PostKey } from '../lib/crypto/postKeyManager';

interface ChannelCommentsProps {
   isOpen: boolean;
   onClose: () => void;
   postId: number;
   postKey: string; // base64-encoded X25519 public key for E2EE
   theme: 'dark' | 'light';
   channelChatId: string;
}

export const ChannelCommentsView = ({ isOpen, onClose, postId, postKey, theme, channelChatId }: ChannelCommentsProps) => {
   const isDark = theme === "dark";
   const [comment, setComment] = useState("");
   const [comments, setComments] = useState<any[]>([
      { id: 1, sender: "Alice Freeman", text: "Wow, that's amazing! 🔥", time: "10:45" },
      { id: 2, sender: "Charlie", text: "Can't wait to test this out later today.", time: "10:49" },
   ]);
   const commentIdRef = useRef<string>(`comment_${postId}`);

   const handleSend = async () => {
      if (!comment.trim()) return;
      
      // Encrypt comment using post key
      const encryptedComment = await messageEncryption.encrypt(channelChatId, JSON.stringify({
         id: Date.now(),
         sender: "me",
         text: comment,
         postId,
         type: "comment"
      }));

      // Broadcast through P2P pipeline
      p2pNetwork.broadcast(JSON.stringify({
         ...encryptedComment,
         chatId: channelChatId,
         postId,
      }));

      // Also update local state for immediate UI feedback
      setComments([
         ...comments,
         { id: Date.now(), sender: "me", text: comment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), postId }
      ]);
      setComment("");
   };

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               initial={{ x: "100%", opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className={`absolute inset-0 z-50 flex flex-col ${isDark ? "bg-[#11141c]" : "bg-[#eaeff4]"}`}
            >
               {/* Header */}
               <div className={`h-[72px] flex items-center px-4 border-b ${isDark ? "border-white/5 bg-[#1a1d24]" : "border-black/5 bg-white"}`}>
                  <div 
                     onClick={onClose}
                     className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors mr-3 ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-500"}`}
                  >
                     <ChevronLeft size={24} />
                  </div>
                  <div>
                     <h3 className={`font-bold text-[15px] ${isDark ? "text-white" : "text-slate-800"}`}>Comments</h3>
                     <p className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? "text-orange-500" : "text-orange-600"}`}>
                        {comments.length} replies
                     </p>
                  </div>
               </div>

               {/* Comments List */}
               <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
                  {comments.map((c) => (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={c.id} 
                        className={`flex flex-col gap-1 p-3 rounded-2xl max-w-[85%] ${c.sender === "me" ? "self-end " + (isDark ? "bg-orange-600/20 border border-orange-500/30 text-white rounded-br-sm" : "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md rounded-br-sm") : "self-start " + (isDark ? "bg-[#1a1d24] border border-white/5 text-gray-300 rounded-bl-sm" : "bg-white border border-black/5 text-slate-700 rounded-bl-sm shadow-sm")}`}
                     >
                        {c.sender !== "me" && (
                           <span className={`text-[11px] font-bold ${isDark ? "text-orange-400" : "text-orange-200"} mb-1`}>
                              {c.sender}
                           </span>
                        )}
                        <p className="text-[14px] leading-relaxed break-words"><FormattedText text={c.text} /></p>
                        <span className={`text-[10px] self-end mt-1 ${c.sender === "me" ? (isDark ? "text-orange-200/50" : "text-white/70") : (isDark ? "text-gray-500" : "text-slate-400")}`}>
                           {c.time}
                        </span>
                     </motion.div>
                  ))}
               </div>

               {/* Input */}
               <div className={`p-4 border-t ${isDark ? "border-white/5 bg-[#1a1d24]/90 backdrop-blur-md" : "border-black/5 bg-[#f4f7f9]/90 backdrop-blur-md"}`}>
                  <div className={`flex items-center w-full h-12 rounded-full px-4 relative ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-[inset_1px_1px_3px_rgba(165,175,190,0.1)]"}`}>
                     <input 
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Write a comment..."
                        className={`flex-1 bg-transparent border-none outline-none text-[14px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
                     />
                     <div 
                        onClick={handleSend}
                        className={`w-9 h-9 flex items-center justify-center rounded-full ml-2 cursor-pointer transition-transform active:scale-95 ${comment ? (isDark ? "bg-orange-500 text-white" : "bg-orange-400 text-white shadow-md") : (isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-slate-400")}`}
                     >
                        <Send size={16} />
                     </div>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};
