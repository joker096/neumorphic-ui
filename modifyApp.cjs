const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Modify RadialMenu interface and implementation to handle clicks
content = content.replace(
  /interface RadialItem \{[\s\S]*?icon: any;\n\}/,
  `interface RadialItem { id: string; angle: number; title: string; subtitle: string; icon: any; }`
);

content = content.replace(
  /const RadialMenu = \(\{[\s\S]*?\}\) => \{/,
  `const RadialMenu = ({ theme, items, centerTitle, centerSubtitle, onCenterClick, onItemClick }: { theme: "light" | "dark"; items: RadialItem[]; centerTitle: string; centerSubtitle: string; onCenterClick?: () => void; onItemClick?: (id: string) => void; }) => {`
);

content = content.replace(
  /<motion\.div\n\s*initial=\{\{\n\s*left: cx,/,
  `<motion.div onClick={() => onItemClick && onItemClick(item.id.toString())} initial={{ left: cx,`
);


// 2. completely replace the App component
const newApp = `export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'hub' | 'chats' | 'radar' | 'calls' | 'settings'>('hub');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  
  const isDark = theme === 'dark';
  const currentChatList = MOCK_CHATS;

  const handleSendMessage = () => {
    if (!messageText.trim() && !morseMode) return;
    setMessageText("");
  };

  const hubItems = [
    { id: 'chats', angle: 45, title: "Chats", subtitle: "Encrypted", icon: MessageCircle },
    { id: 'radar', angle: 135, title: "Radar", subtitle: "Mesh Nodes", icon: Target },
    { id: 'calls', angle: 225, title: "Calls", subtitle: "Audio Link", icon: Phone },
    { id: 'settings', angle: 315, title: "Settings", subtitle: "Local Config", icon: Settings },
  ];

  return (
    <div className={\`min-h-screen flex flex-col items-center justify-center font-sans select-none overflow-hidden relative \${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}\`}>
      {isDark && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      )}
      
      {/* Absolute theme toggle at top right to keep it out of the way */}
      <div 
        onClick={() => setTheme(isDark ? 'light' : 'dark')} 
        className={\`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer z-50 transition-all \${isDark ? "bg-[#13151b] border border-white/10 hover:bg-white/5 text-orange-400" : "bg-[#eaeff4] border border-black/10 hover:bg-white text-slate-500 shadow-md"}\`}
      >
        {isDark ? <Moon size={20} /> : <Settings size={20} />}
      </div>

      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100"
          >
            <RadialMenu 
              theme={theme} 
              items={hubItems} 
              centerTitle="Mess&Anger" 
              centerSubtitle="P2P Hub" 
              onCenterClick={() => {}} 
              onItemClick={(id) => setView(id as any)}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="content-view"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-8 pb-24 h-full"
          >
            {/* Top Back/Title Bar */}
            <div className="flex items-center gap-4 px-8 py-4 mb-4">
              <div 
                onClick={() => {
                  if (activeChat) setActiveChat(null);
                  else setView('hub');
                }}
                className={\`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 \${isDark ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10" : "bg-[#f4f7f9] border border-black/10 hover:bg-white shadow-md"}\`}
              >
                <ChevronRight size={24} className="rotate-180" />
              </div>
              <h2 className="text-2xl font-serif tracking-wide capitalize">
                {activeChat ? activeChat.name : view}
              </h2>
            </div>
            
            {/* Content Switcher */}
            <div className="flex-1 overflow-hidden relative px-4 flex flex-col justify-center items-center">
              {view === 'radar' && <MeshRadar theme={theme} />}
              {view === 'calls' && <Dialpad theme={theme} />}
              {view === 'settings' && <PillMenuMock theme={theme} />}
              
              {view === 'chats' && (
                !activeChat ? (
                  <div className={\`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 \${isDark ? "bg-[#11141c]/50 border border-white/5" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner"}\`}>
                    <div className="mb-6 relative z-30">
                      {isDark ? <DarkSearchBar /> : <LightSearchBar />}
                    </div>
                    <div className={\`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 \${isDark ? "text-orange-500" : "text-orange-600"}\`}>Conversations</div>
                    {currentChatList.map(c => (
                      <ChatListItem key={c.id} chat={c} theme={theme} type="chat" active={false} onClick={() => setActiveChat(c)} />
                    ))}
                    <div className={\`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 mt-8 \${isDark ? "text-purple-500" : "text-purple-600"}\`}>Channels</div>
                    {MOCK_CHANNELS.map(c => (
                      <ChatListItem key={c.id} chat={c} theme={theme} type="channel" active={false} onClick={() => setActiveChat(c)} />
                    ))}
                  </div>
                ) : (
                  <div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-6 max-h-[800px]">
                    <ChatPreviewLayer chat={activeChat} theme={theme} onClose={() => setActiveChat(null)} />
                    
                    {/* Input Field Overlay */}
                    <div className={\`absolute bottom-4 left-4 right-4 rounded-3xl p-3 flex flex-col gap-2 z-50 \${isDark ? "bg-[#1a1d24]/90 border border-white/10 backdrop-blur-xl" : "bg-white/90 border border-black/10 backdrop-blur-xl shadow-xl"}\`}>
                      <div className="flex items-center gap-3">
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 \${isDark ? "bg-[#13151b] text-gray-400 hover:text-white" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800"}\`}><Plus size={20} /></div>
                        
                        <div className={\`flex-1 h-12 rounded-full px-4 flex items-center relative \${isDark ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[#f4f7f9] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"}\`}>
                          <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={morseMode ? "Type to encode in Morse..." : "Message..."} className={\`w-full bg-transparent border-none outline-none text-[14px] \${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"} \${morseMode ? "font-mono text-amber-500" : ""}\`} />
                          <div onClick={() => setMorseMode(!morseMode)} className={\`absolute right-2 px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors \${morseMode ? (isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700") : (isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-400")}\`}>●●● ─</div>
                        </div>
                        
                        <div onClick={handleSendMessage} className={\`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 \${messageText ? (isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-md") : (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-500/10 text-orange-600")}\`}>
                          {messageText ? <ChevronRight size={20} /> : <Mic size={20} />}
                        </div>
                      </div>
                      {morseMode && messageText && (
                        <div className="px-5 pt-1 pb-1 font-mono text-[10.5px] text-amber-500/80 tracking-widest break-all">
                          {encodeMorse(messageText)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* Bottom floating Home action */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center group pointer-events-auto z-50">
               <div 
                 onClick={() => { setActiveChat(null); setView('hub'); }} 
                 className={\`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 \${isDark ? "bg-[#1a1d24] border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.08)] hover:bg-[#1f222a]" : "bg-gradient-to-b from-[#f4f7f9] to-[#e2e8f0] border border-white/90 shadow-[0_12px_24px_rgba(165,175,190,0.6),_inset_2px_2px_4px_rgba(255,255,255,1)] hover:shadow-xl"}\`}
               >
                 <CustomDiamondIcon className={\`\${isDark ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"} group-hover:scale-110 transition-transform\`} />
               </div>
               <span className={\`text-[9px] uppercase tracking-widest mt-2 font-bold \${isDark ? "text-gray-500 group-hover:text-orange-400" : "text-slate-400 group-hover:text-orange-600"} transition-colors\`}>Hub</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

const appIndex = content.indexOf('export default function App() {');
if (appIndex !== -1) {
  content = content.substring(0, appIndex) + newApp;
  fs.writeFileSync('src/App.tsx', content, 'utf8');
} else {
  console.log("Could not find App component");
}
