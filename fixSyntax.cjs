const fs = require('fs');
let code = fs.readFileSync('newApp.txt', 'utf8');

const navCode = `
            <div 
              onClick={() => setView('chats')}
              className={\`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'chats' ? (isDark ? "bg-[#1a1d24] text-orange-400 shadow-sm" : "bg-white text-orange-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Chats
            </div>
            <div 
              onClick={() => setView('calls')}
              className={\`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'calls' ? (isDark ? "bg-[#1a1d24] text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Calls
            </div>
            <div 
              onClick={() => setView('radar')}
              className={\`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'radar' ? (isDark ? "bg-[#1a1d24] text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Radar
            </div>
            <div 
              onClick={() => setView('settings')}
              className={\`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'settings' ? (isDark ? "bg-[#1a1d24] text-purple-400 shadow-sm" : "bg-white text-purple-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Settings
            </div>
`;

code = code.replace(/<div\s*onClick=\{\(\) => setView\('chats'\)\}[\s\S]*?Mesh Compass\s*<\/div>/, () => navCode);

const viewsCode = `          {view === 'radar' ? (
             <div className="w-[800px] flex flex-col items-center animate-fade-in relative z-10 pt-10">
                <MeshRadar theme={theme} />
             </div>
          ) : view === 'calls' ? (
             <div className="w-[800px] flex flex-col items-center animate-fade-in relative z-10 pt-10">
                <div className={\`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 \${isDark ? "text-blue-500" : "text-blue-600"}\`}>Secure Voice Link</div>
                <Dialpad theme={theme} />
             </div>
          ) : view === 'settings' ? (
             <div className="w-[800px] flex flex-col items-center animate-fade-in relative z-10 pt-10">
                <div className={\`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 \${isDark ? "text-purple-500" : "text-purple-600"}\`}>Menu Blocks (Fixed)</div>
                <PillMenuMock theme={theme} />
             </div>
          ) : view === 'chats' ? (`;

code = code.replace(/\{view === 'radar' \? \([\s\S]*?\) : view === 'chats' \? \(/, () => viewsCode);

code = code.replace(/ className="flex-1 overflow-y-auto px-5 py-4 pb-20 relative z-20"/, () => ` className={\`flex-1 overflow-y-auto px-5 py-4 pb-20 relative z-20 \${isDark ? "scrollbar-dark" : "scrollbar-light"}\`}`);

// Save to a fresh new file
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const index = appCode.indexOf('export default function App() {');
if (index !== -1) {
    let top = appCode.substring(0, index);
    
    // Also fix PillButton
    top = top.replace(
      /isLarge\s*\?\s*"text-\[14px\] w-full text-center".*?\}/,
      () => `isLarge ? "text-[14px] w-full text-center" : "text-[12px] font-bold"} leading-[14px] transition-colors \${active ? (isDark ? "text-white font-bold drop-shadow-sm" : "text-slate-900 font-bold drop-shadow-sm") : isDark ? "text-white font-bold group-hover:text-white" : "text-slate-900 font-bold group-hover:text-slate-800"}`
    )
    top = top.replace(/onClick=\{\(\) => \{\}\}/g, `onClick={() => {}} active={true}`);
    
    fs.writeFileSync('src/App.tsx', top + code, 'utf8');
}
