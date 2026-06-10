import React, { useState } from 'react';

// Very simple recursive formatter for basic markdown-like syntax
export const FormattedText = ({ text, searchTerm = "" }: { text: string, searchTerm?: string }) => {
  if (!text) return null;
  const safeText = String(text);
  // Simple regex parser - headers, blockquotes, strikethrough, bold, italic, spoiler, code
  const parts = safeText.split(/(~~.*?~~|\*\*.*?\*\*|__.*?__|\|\|.*?\|\||`.*?`)/g);

  const renderLinks = (content: string) => {
    const linkParts = content.split(/(https?:\/\/[^\s]+)/g);
    return linkParts.map((chunk, index) => {
      if (/^https?:\/\/[^\s]+$/i.test(chunk)) {
        return (
          <a
            key={index}
            href={chunk}
            target="_blank"
            rel="noreferrer"
            className="text-orange-500 underline decoration-orange-500/40 underline-offset-2 break-all hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {chunk}
          </a>
        );
      }
      return chunk;
    });
  };

  const renderMentions = (content: string) => {
    const mentionParts = content.split(/(@[a-zA-Z0-9_]+)/g);
    return mentionParts.map((chunk, index) => {
      if (/^@[a-zA-Z0-9_]+$/.test(chunk)) {
        return (
          <span key={index} className="bg-amber-400/20 text-amber-700 dark:text-amber-300 dark:bg-amber-500/20 rounded px-1 font-semibold">
            {chunk}
          </span>
        );
      }
      return renderLinks(chunk);
    });
  };

  const renderHighlight = (content: string) => {
    if (!searchTerm) return content;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const splitContent = content.split(regex);
    return splitContent.map((chunk, index) => 
      regex.test(chunk) ? (
         <span key={index} className="bg-yellow-400/40 text-yellow-900 dark:text-yellow-100 dark:bg-yellow-500/50 rounded px-0.5">{chunk}</span>
      ) : renderMentions(chunk)
    );
  };

  return (
    <>
      {parts.map((part, i) => {
         // Headers
         if (part.startsWith('### ')) {
            return <span key={i} className="text-[11px] font-bold uppercase tracking-widest opacity-60">{renderHighlight(part.slice(4))}</span>;
         }
         if (part.startsWith('## ')) {
            return <span key={i} className="text-[12px] font-bold uppercase tracking-widest opacity-70">{renderHighlight(part.slice(3))}</span>;
         }
         if (part.startsWith('# ')) {
            return <span key={i} className="text-[14px] font-bold">{renderHighlight(part.slice(2))}</span>;
         }
         // Blockquotes
         if (part.startsWith('> ')) {
            return (
              <blockquote key={i} className={`my-1 pl-3 border-l-2 border-gray-500/30 italic text-[12px] ${part.length > 100 ? "" : ""}`}>
                {renderHighlight(part.slice(2))}
              </blockquote>
            );
         }
         if (part.startsWith('>\n')) {
            return (
              <blockquote key={i} className={`my-1 pl-3 border-l-2 border-gray-500/30 italic text-[12px] ${part.length > 100 ? "" : ""}`}>
                {renderHighlight(part.slice(2))}
              </blockquote>
            );
         }
         // Strikethrough
         if (part.startsWith('~~') && part.endsWith('~~')) {
            return <s key={i} className="opacity-80">{renderHighlight(part.slice(2, -2))}</s>;
         }
         // Bold
         if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{renderHighlight(part.slice(2, -2))}</strong>;
         }
         // Italic
         if (part.startsWith('__') && part.endsWith('__')) {
            return <em key={i} className="italic">{renderHighlight(part.slice(2, -2))}</em>;
         }
         // Spoiler
         if (part.startsWith('||') && part.endsWith('||')) {
            return <Spoiler key={i} text={part.slice(2, -2)} renderHighlight={renderHighlight} />;
         }
         // Inline code
         if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[0.9em] mx-0.5">{part.slice(1, -1)}</code>;
         }
         // Render plain text with newlines
         return part.split('\n').map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>
               {renderHighlight(line)}
               {j < arr.length - 1 && <br />}
            </React.Fragment>
         ));
      })}
    </>
  );
};

const Spoiler = ({ text, renderHighlight }: { text: string, renderHighlight?: (t: string) => React.ReactNode }) => {
   const [revealed, setRevealed] = useState(false);
   
   return (
      <span 
         onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
         className={`cursor-pointer transition-all duration-300 rounded px-1 group relative overflow-hidden inline-flex ${revealed ? "" : "bg-white/20 dark:bg-black/30 backdrop-blur-2xl text-transparent"}`}
      >
         {revealed ? "" : (
            <div className="absolute inset-0 z-10 noise-bg mix-blend-overlay opacity-30"></div>
         )}
         <span className={`relative z-20 ${revealed ? "" : "blur-[4px]"}`}>
            {renderHighlight ? renderHighlight(text) : text}
         </span>
         {!revealed && <style>{`
            .noise-bg {
               background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }
         `}</style>}
      </span>
   );
};
