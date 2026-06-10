const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// We are going to modify the toggle buttons in the Top Navbar
let navButtons = `
            <div 
              onClick={() => setView('chats')}
              className={\`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'chats' ? (isDark ? "bg-[#1a1d24] text-orange-400 shadow-sm" : "bg-white text-orange-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Chats
            </div>
            <div 
              onClick={() => setView('calls')}
              className={\`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'calls' ? (isDark ? "bg-[#1a1d24] text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Calls
            </div>
            <div 
              onClick={() => setView('radar')}
              className={\`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all \${view === 'radar' ? (isDark ? "bg-[#1a1d24] text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm") : (isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}\`}
            >
              Mesh Compass
            </div>
`;

// Also inside the view logic
let newViewContent = `
          {view === 'radar' ? (
             <div className="w-[800px] flex flex-col items-center animate-fade-in relative z-10 pt-10">
                <MeshRadar theme={theme} />
             </div>
          ) : view === 'calls' ? (
             <div className="w-[800px] flex flex-col items-center animate-fade-in relative z-10 pt-10">
                <Dialpad theme={theme} />
             </div>
          ) : view === 'chats' ? (
`;

// Apply these to the App component
// We can just use replace
content = content.replace(
  /<div \s*onClick=\{\(\) => setView\('chats'\)\}[\s\S]*?Mesh Compass\s*<\/div>\s*<\/div>/,
  function(match) {
    // Keep the wrapper
    return navButtons + '\n          </div>';
  }
);

content = content.replace(
  /\{view === 'radar' \? \([\s\S]*?\) : view === 'chats' \? \(/,
  newViewContent
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated App views");
