import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, ChevronLeft } from 'lucide-react';
import { FormattedText } from '../chat-preview/FormattedText';
import { messageEncryption } from '../../lib/crypto/MessageEncryptionService';
import { p2pNetwork } from '../../lib/p2p/network';
import { generatePostKey, PostKey } from '../../lib/crypto/postKeyManager';
import { useI18n } from '../../lib/i18n';

interface ChannelCommentsProps {
   isOpen: boolean;
   onClose: () => void;
   postId: number;
   postKey: string;
   channelChatId: string;
   theme?: string;
  }

export const ChannelCommentsView = ({ isOpen, onClose, postId, postKey, channelChatId }: ChannelCommentsProps) => {
   const { t } = useI18n();
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
               className="absolute inset-0 z-50 flex flex-col bg-[--bg-primary]"
            >
               {/* Header */}
               <div className="h-[72px] flex items-center px-4 border-b bg-white border-black/5">
                  <button
                       onClick={onClose}
                       className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all mr-3 neu-button"
                    >
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                         <path d="M13 15l6-6-6-6" />
                       </svg>
                    </button>
                   <div>
                       <h3 className="font-bold text-[15px] text-[--text-primary]">{t('channelComments.title')}</h3>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-[--accent]">
                         {t('channelComments.replies', { count: comments.length })}
                      </p>
                   </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                   {comments.map((c) => (
                      <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={c.id} 
                         className={`flex flex-col gap-1 p-3 rounded-md max-w-[85%] ${c.sender === "me" ? "self-end chat-bubble-own rounded-br-sm" : "self-start chat-bubble-other rounded-bl-sm"}`}
                      >
                         {c.sender !== "me" && (
                            <span className="text-[11px] font-bold text-[--accent] mb-1">
                               {c.sender}
                            </span>
                         )}
                         <p className="text-[14px] leading-relaxed break-words"><FormattedText text={c.text} /></p>
                         <span className={`text-[10px] self-end mt-1 ${c.sender === "me" ? "text-white/70" : "text-[--text-secondary]"}`}>
                            {c.time}
                         </span>
                      </motion.div>
                   ))}
                </div>

                {/* Input */}
                 <div className="p-4 border-t border-black/5 bg-[var(--bg-elevated)]/90 backdrop-blur-md">
                   <div className="flex items-center w-full h-12 rounded-full px-4 relative neu-search-wrapper">
                      <input 
                         type="text"
                         value={comment}
                         onChange={(e) => setComment(e.target.value)}
                         onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          placeholder={t('channelComments.placeholder')}
                         className="flex-1 bg-transparent border-none outline-none text-[14px] text-[--text-primary]"
                      />
                      <div 
                         onClick={handleSend}
                         className={`w-9 h-9 flex items-center justify-center rounded-full ml-2 cursor-pointer transition-transform active:scale-95 ${comment ? "bg-orange-500 text-white" : "bg-[--bg-secondary] text-[--text-secondary]"}`}
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
