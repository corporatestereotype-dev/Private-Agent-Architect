
import React, { useEffect, useState } from 'react';
import { ProviderSettings } from '../types';
import { Settings as SettingsIcon, Database, Cpu, Cloud, RefreshCcw, Github, Shield, Box } from 'lucide-react';

interface SettingsProps {
  settings: ProviderSettings;
  setSettings: (s: ProviderSettings) => void;
}

interface OllamaModel {
  name: string;
}

export const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [localModels, setLocalModels] = useState<string[]>(['codestral', 'llama3', 'mistral']);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchOllamaModels = async () => {
    setIsLoadingModels(true);
    setHasError(false);
    try {
      const response = await fetch(`${settings.ollamaUrl}/api/tags`, {
        method: 'GET',
        mode: 'cors',
      });
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: OllamaModel) => m.name) || [];
        if (models.length > 0) {
          setLocalModels(models);
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchOllamaModels();
  }, [settings.ollamaUrl]);

  return (
    <div className="p-4 space-y-4 bg-zinc-900/50 border-b border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 font-semibold">
          <SettingsIcon size={18} />
          <h2 className="text-xs font-black uppercase tracking-widest">Provider Orchestration</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ollama */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
              <Cpu size={12} /> Ollama
            </div>
          </div>
          <input
            type="text"
            value={settings.ollamaUrl}
            onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none focus:border-orange-500"
            placeholder="http://localhost:11434"
          />
          <select
            value={settings.ollamaModel}
            onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none"
          >
            {localModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Hugging Face Bridge */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
            <Box size={12} /> HF Local Bridge
          </div>
          <input
            type="text"
            value={settings.hfUrl}
            onChange={(e) => setSettings({ ...settings, hfUrl: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none focus:border-yellow-500"
            placeholder="http://localhost:8000"
          />
          <input
            type="text"
            value={settings.hfModel}
            onChange={(e) => setSettings({ ...settings, hfModel: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none"
            placeholder="microsoft/Phi-3-mini"
          />
        </div>

        {/* Gemini */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
            <Cloud size={12} /> Gemini Cloud
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.useCloud}
              onChange={(e) => setSettings({ ...settings, useCloud: e.target.checked })}
              className="accent-blue-600"
            />
            <span className="text-[9px] text-zinc-500 uppercase font-bold">Supervision</span>
          </div>
          <select
             disabled={!settings.useCloud}
             value={settings.cloudModel}
             onChange={(e) => setSettings({ ...settings, cloudModel: e.target.value })}
             className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none disabled:opacity-30"
          >
            <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
          </select>
        </div>

        {/* Secret Keys */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} /> Keys
          </div>
          <input
            type="password"
            value={settings.hfToken || ''}
            onChange={(e) => setSettings({ ...settings, hfToken: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none"
            placeholder="HF Token"
          />
          <input
            type="password"
            value={settings.githubToken || ''}
            onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none"
            placeholder="GitHub PAT"
          />
        </div>
      </div>
    </div>
  );
};
