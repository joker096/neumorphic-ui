const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const updatedNav = `
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

content = content.replace(
  /<div \s*onClick=\{\(\) => setView\('chats'\)\}[\s\S]*?Mesh Compass\s*<\/div>\s*<\/div>/,
  function(match) {
    return updatedNav + '\n          </div>';
  }
);

const newViews = `
          {view === 'radar' ? (
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
          ) : view === 'chats' ? (
`;

content = content.replace(
  /\{view === 'radar' \? \([\s\S]*?\) : view === 'chats' \? \(/,
  newViews
);

content = content.replace(
  /isLarge\s*\?\s*"text-\[14px\] w-full text-center".*?\}/,
  function(match) {
    return match.replace('text-gray-400', 'text-white font-bold').replace('text-slate-500', 'text-slate-900 font-bold');
  }
);

content = content.replace(
  /onClick=\{\(\) => \{\}\}/g,
  `onClick={() => {/* no-op but clickable */}} active={true}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated fully");
