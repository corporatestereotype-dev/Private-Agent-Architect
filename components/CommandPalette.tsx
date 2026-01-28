
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code, Settings, Zap, Search, Shield, Cpu, Cloud, Plus } from 'lucide-react';

interface Command {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) || 
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-950/50">
          <Search size={18} className="text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands (e.g. /plan, /debug, /settings)..."
            className="w-full py-4 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <div className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-500 font-mono">ESC</div>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  idx === selectedIndex ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${idx === selectedIndex ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">{cmd.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{cmd.description}</div>
                  </div>
                </div>
                {cmd.shortcut && (
                  <div className="text-[10px] font-mono text-zinc-600 uppercase bg-black/30 px-1.5 py-0.5 rounded border border-zinc-800">
                    {cmd.shortcut}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-10 text-center text-zinc-500">
              <div className="text-xs uppercase font-black tracking-widest opacity-20 mb-2">No matching commands</div>
              <p className="text-[10px]">Try typing / to see available slash commands</p>
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-600 uppercase">
              <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-zinc-800 rounded">↑↓</span> Navigate</span>
              <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-zinc-800 rounded">ENTER</span> Execute</span>
           </div>
           <div className="flex items-center gap-1 text-[9px] font-mono text-blue-500/50">
             AGENT_ARCHITECT_SHELL v1.0
           </div>
        </div>
      </motion.div>
    </div>
  );
};
