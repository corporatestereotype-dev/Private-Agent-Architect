
import React from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  return (
    <div className="h-48 bg-black border-t border-zinc-800 font-mono text-xs flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
        <TerminalIcon size={14} />
        <span>VIRTUAL TERMINAL</span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto text-green-500 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="text-zinc-500 mr-2">$</span>
            {log}
          </div>
        ))}
        <div className="flex items-center gap-2">
           <span className="text-zinc-500">$</span>
           <span className="animate-pulse w-2 h-4 bg-green-500"></span>
        </div>
      </div>
    </div>
  );
};
