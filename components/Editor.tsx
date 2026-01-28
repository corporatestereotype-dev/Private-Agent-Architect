
import React, { useState } from 'react';
import { 
  FileCode, FileText, Cpu, Cloud, GitMerge, Check, MousePointer2, 
  Pin, ArrowLeftRight, ShieldCheck 
} from 'lucide-react';
import { FileNode } from '../types';

interface EditorProps {
  files: FileNode[];
  activeFile: number;
  setActiveFile: (i: number) => void;
}

export const Editor: React.FC<EditorProps> = ({ files, activeFile, setActiveFile }) => {
  const [showDiff, setShowDiff] = useState(true);
  // Track which diff blocks are manually "pinned" (overridden) by the user
  const [overriddenBlocks, setOverriddenBlocks] = useState<Record<string, Set<number>>>({});

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 bg-zinc-950/50">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">Initialize an architectural blueprint to begin</p>
        </div>
      </div>
    );
  }

  const currentFile = files[activeFile];

  const handleManualOverride = (blockIdx: number) => {
    const fileId = currentFile.path;
    setOverriddenBlocks(prev => {
      const fileBlocks = new Set(prev[fileId] || []);
      if (fileBlocks.has(blockIdx)) {
        fileBlocks.delete(blockIdx);
      } else {
        fileBlocks.add(blockIdx);
      }
      return { ...prev, [fileId]: fileBlocks };
    });
  };

  const isBlockPinned = (idx: number) => overriddenBlocks[currentFile.path]?.has(idx);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 border-r border-zinc-800/50">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <div className="flex overflow-x-auto scrollbar-hide">
          {files.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setActiveFile(idx)}
              className={`flex items-center gap-2 px-4 py-2 text-xs border-r border-zinc-800 whitespace-nowrap transition-all ${
                activeFile === idx 
                ? 'bg-zinc-950 text-blue-400 font-bold shadow-[inset_0_-2px_0_rgba(59,130,246,0.6)]' 
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
              }`}
            >
              <FileText size={14} className={activeFile === idx ? "text-blue-500" : "text-zinc-600"} />
              {file.name}
            </button>
          ))}
        </div>
        <div className="px-3 flex items-center gap-2">
           <button 
             onClick={() => setShowDiff(!showDiff)}
             className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black tracking-tighter transition-all duration-300 ${
               showDiff 
               ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
               : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
             }`}
           >
             <GitMerge size={12} className={showDiff ? "animate-pulse" : ""} />
             {showDiff ? 'COLLABORATIVE SYNTHESIS' : 'STABLE SOURCE'}
           </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-0 overflow-auto font-mono text-[13px] leading-relaxed custom-scrollbar bg-[#080808]">
        {showDiff && currentFile?.diff ? (
          <div className="min-w-full inline-block pb-20">
            {currentFile.diff.map((part, i) => {
              const isLocal = part.added || part.origin === 'local';
              const isCloud = part.removed || part.origin === 'cloud';
              const isPinned = isBlockPinned(i);
              
              // Dynamic styling based on source and override state
              const bgColor = isLocal 
                ? isPinned ? 'bg-green-500/15' : 'bg-green-500/5 hover:bg-green-500/10' 
                : isCloud 
                  ? isPinned ? 'bg-blue-500/15' : 'bg-blue-500/5 hover:bg-blue-500/10' 
                  : 'hover:bg-white/5';
              
              const borderStyle = isLocal 
                ? `border-l-4 ${isPinned ? 'border-green-400' : 'border-green-500/40'}` 
                : isCloud 
                  ? `border-l-4 ${isPinned ? 'border-blue-400' : 'border-blue-500/40'}` 
                  : 'border-l-4 border-transparent';
              
              const textColor = isLocal 
                ? 'text-green-300/90' 
                : isCloud 
                  ? 'text-blue-300/90' 
                  : 'text-zinc-400';

              return (
                <div 
                  key={i} 
                  onClick={() => (isLocal || isCloud) && handleManualOverride(i)}
                  className={`group relative flex items-start py-1 px-4 transition-all duration-200 ${bgColor} ${borderStyle} border-b border-white/[0.03] ${ (isLocal || isCloud) ? 'cursor-pointer' : ''}`}
                >
                  <div className="w-8 flex-shrink-0 select-none text-[9px] font-black pt-1">
                    <span className="opacity-20 group-hover:opacity-100 transition-opacity">
                      {i + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-hidden pr-24">
                    <pre className={`whitespace-pre-wrap break-all ${textColor} ${isPinned ? 'font-bold' : ''}`}>
                      {part.value}
                    </pre>
                  </div>

                  {(isLocal || isCloud) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                       <div className="flex flex-col items-end">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${isLocal ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isLocal ? 'Local logic' : 'Cloud Pattern'}
                          </span>
                          {isPinned && <span className="text-[7px] text-zinc-500 font-bold mt-1 flex items-center gap-1"><Pin size={8} /> PERSISTED</span>}
                       </div>
                       <div className={`p-2 rounded border transition-all ${isPinned ? 'bg-zinc-100 border-white text-zinc-900 scale-110 shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:border-zinc-500'}`}>
                         {isPinned ? <Check size={12} strokeWidth={3} /> : <ArrowLeftRight size={12} />}
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 h-full bg-[#0a0a0a]">
            <pre className="text-zinc-300 leading-relaxed font-mono">
              <code>{currentFile?.content || '// Finalizing structural synthesis...'}</code>
            </pre>
          </div>
        )}
      </div>
      
      {/* Legend & Health Bar */}
      <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
            <span className="text-[10px] font-black text-blue-400/80 tracking-tighter uppercase">Cloud Blueprint</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded bg-green-500/40 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
            <span className="text-[10px] font-black text-green-400/80 tracking-tighter uppercase">Local Optimized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700"></div>
            <span className="text-[10px] font-black text-zinc-500 tracking-tighter uppercase">Shared Core</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-zinc-500">
             <MousePointer2 size={10} />
             <span className="tracking-tighter uppercase">Manual Overrides Enabled</span>
          </div>
          <span className="w-px h-3 bg-zinc-800"></span>
          <div className="flex items-center gap-1.5 text-green-500/80">
             <ShieldCheck size={12} />
             <span className="tracking-tighter uppercase">Privacy Scrubbed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
