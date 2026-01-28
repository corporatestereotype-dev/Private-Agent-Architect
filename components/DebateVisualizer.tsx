
import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Cpu, ShieldCheck, Zap, GitMerge, AlertCircle } from 'lucide-react';
import { FileNode } from '../types';

interface DebateVisualizerProps {
  file: FileNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DebateVisualizer: React.FC<DebateVisualizerProps> = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <GitMerge size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Structural Debate Console
                  <span className="text-[10px] py-0.5 px-2 bg-zinc-800 text-zinc-400 rounded-full font-mono border border-zinc-700">
                    {file.path}
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Synthesizing architectural patterns with local performance optimizations</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800 overflow-hidden">
          {/* Cloud Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 bg-blue-500/5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <Cloud size={14} /> Cloud Architect
              </div>
              <span className="text-[9px] text-blue-500/50 font-mono">GEMINI-3-PRO</span>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed scrollbar-hide bg-zinc-950/20">
              {file.diff?.filter(d => !d.added).map((d, i) => (
                <div key={i} className={`${d.removed ? 'text-blue-400/90 bg-blue-500/5 border-l-2 border-blue-500' : 'text-zinc-600'} px-2`}>
                  {d.value}
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-500/5 text-[9px] text-blue-400/70 italic border-t border-zinc-800">
              Focus: Error boundaries, types, and modular patterns.
            </div>
          </div>

          {/* Local Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 bg-orange-500/5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                <Cpu size={14} /> Local Worker
              </div>
              <span className="text-[9px] text-orange-500/50 font-mono">CODESTRAL-22B</span>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed scrollbar-hide bg-zinc-950/20">
              {file.diff?.filter(d => d.added).map((d, i) => (
                <div key={i} className="text-orange-400/90 bg-orange-500/5 border-l-2 border-orange-500 px-2">
                  {d.value}
                </div>
              ))}
            </div>
            <div className="p-3 bg-orange-500/5 text-[9px] text-orange-400/70 italic border-t border-zinc-800">
              Focus: Performance, dependency minimalization, and local execution.
            </div>
          </div>

          {/* Judge / Result Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 shadow-inner">
            <div className="p-4 bg-zinc-900 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-100 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="text-green-500" /> Synthesized Result
              </div>
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-yellow-500" />
                <span className="text-[9px] text-zinc-500 font-mono">JUDGE PROTOCOL v4</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed scrollbar-hide text-zinc-300">
              <pre><code>{file.content}</code></pre>
            </div>
            
            {/* Judge Insights */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertCircle size={10} /> Judge's Reasoning
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-[10px] text-zinc-400">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>Preserved Cloud's <strong>Error Boundary</strong> wrappers for safety.</span>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-zinc-400">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <span>Injected Local's <strong>Optimized Loops</strong> into functional blocks.</span>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-zinc-400">
                  <div className="w-1 h-1 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                  <span>Privacy Scrubber replaced <strong>2 Hardcoded Strings</strong> with Env Vars.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Blueprint</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500/50" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Implementation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Synthesized</span>
              </div>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
              LATENCY: 142ms <span className="text-zinc-800">|</span> TOKEN_SYNTH: 1.4k
           </div>
        </div>
      </div>
    </motion.div>
  );
};
