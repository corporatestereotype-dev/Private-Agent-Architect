
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Send, Eye, Cpu, CheckCircle2, Loader2, History, Box, Layers, RefreshCw, Mic, MicOff, MessageSquare, Code, ShieldCheck, Zap, GitMerge, Cloud, Command as CommandIcon, Plus, Github, ExternalLink, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentStep, FileNode, ProjectState, ProviderSettings, Message, GitHubState } from './types';
import { AIOrchestrator } from './services/orchestrator';
import { GitHubService } from './services/githubService';
import { Settings } from './components/Settings';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { DebateVisualizer } from './components/DebateVisualizer';
import { CommandPalette } from './components/CommandPalette';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<AgentStep>(AgentStep.IDLE);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [previewKey, setPreviewKey] = useState(0);
  const [isHmrSyncing, setIsHmrSyncing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['System initialized...', 'Ready for architectural commands.']);
  const [isLive, setIsLive] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const [settings, setSettings] = useState<ProviderSettings>({
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'codestral',
    hfUrl: 'http://localhost:8000',
    hfModel: 'microsoft/Phi-3-mini-4k-instruct',
    useCloud: true,
    cloudModel: 'gemini-3-pro-preview',
    githubToken: ''
  });

  const orchestrator = useRef<AIOrchestrator>(new AIOrchestrator(settings));
  const liveSessionRef = useRef<any>(null);
  
  const projectHash = useMemo(() => {
    if (!project) return '';
    return project.files.map(f => `${f.path}:${f.content.length}`).join('|');
  }, [project?.files]);

  useEffect(() => {
    orchestrator.current = new AIOrchestrator(settings);
  }, [settings]);

  useEffect(() => {
    if (!project || project.files.length === 0) return;
    setIsHmrSyncing(true);
    const timer = setTimeout(() => {
      setPreviewKey(prev => prev + 1);
      setIsHmrSyncing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [projectHash]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const toggleLive = async () => {
    if (isLive) {
      liveSessionRef.current?.close();
      setIsLive(false);
      return;
    }
    const session = await orchestrator.current.connectLive({
      onopen: () => { setIsLive(true); addLog("Live API session connected."); },
      onmessage: async (msg: any) => {},
      onclose: () => setIsLive(false),
      onerror: () => setIsLive(false)
    });
    liveSessionRef.current = session;
  };

  const handleGitHubDeployment = async () => {
    if (!settings.githubToken) {
      addLog("[GITHUB] Error: No GitHub Token found in settings.");
      return;
    }
    if (!project || project.files.length === 0) {
      addLog("[GITHUB] Error: No project code to deploy.");
      return;
    }

    setStep(AgentStep.DEPLOY);
    addLog("[CI/CD] Initiating GitHub deployment sequence...");
    const gh = new GitHubService(settings.githubToken);

    try {
      let currentRepo = project.github;
      if (!currentRepo) {
        addLog("[GITHUB] Provisioning new repository...");
        const repo = await gh.createRepo(`architect-${Date.now()}`);
        currentRepo = {
          repoName: repo.name,
          owner: repo.owner.login,
          url: repo.html_url,
          workflowActive: true
        };
        addLog(`[GITHUB] Repository created: ${repo.html_url}`);
      }

      addLog("[GITHUB] Committing file set to main branch...");
      await gh.commitFiles(currentRepo.owner, currentRepo.repoName, project.files);
      
      addLog("[CI/CD] Injecting GitHub Actions workflow...");
      await gh.setupCICD(currentRepo.owner, currentRepo.repoName);
      
      setProject(prev => prev ? { ...prev, github: currentRepo } : null);
      addLog("[CI/CD] Deployment complete. Pipeline is now RUNNING.");
      orchestrator.current.speak("Deployment sequence complete. Your project is live on GitHub with active CI/CD.");
    } catch (err: any) {
      addLog(`[GITHUB] Deployment Failed: ${err.message}`);
    } finally {
      setStep(AgentStep.IDLE);
    }
  };

  const executeSlashCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    switch (command) {
      case '/plan': startAgentLoop(); break;
      case '/debug': orchestrator.current.speak("Initiating diagnostic sweep."); break;
      case '/reset':
        setProject(null);
        setMessages([]);
        setLogs(['System reset completed.']);
        break;
      case '/debate': setShowDebate(true); break;
      case '/deploy': handleGitHubDeployment(); break;
      case '/repo': 
        if (project?.github?.url) window.open(project.github.url, '_blank');
        else addLog("No active repository found.");
        break;
      default: addLog(`Unknown command: ${command}`);
    }
    setPrompt('');
  };

  const startAgentLoop = async () => {
    if (!prompt.trim()) return;
    if (prompt.startsWith('/')) { executeSlashCommand(prompt); return; }
    setStep(AgentStep.PLAN);
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    addLog(`Deep Thinking Planner engaged...`);
    const fileList = await orchestrator.current.generatePlan(prompt);
    setProject({ name: 'Project Alpha', files: [], plan: fileList });
    setStep(AgentStep.EXECUTE);
    const generatedFiles: FileNode[] = [];
    for (const filePath of fileList) {
      addLog(`Synthesizing ${filePath}...`);
      const result = await orchestrator.current.generateFileHybrid(filePath, prompt, "");
      generatedFiles.push({
        name: filePath.split('/').pop() || filePath,
        path: filePath,
        content: result.code,
        diff: result.diff,
        language: 'typescript'
      });
      setProject(prev => prev ? { ...prev, files: [...generatedFiles] } : null);
    }
    setStep(AgentStep.VERIFY);
    await new Promise(resolve => setTimeout(resolve, 800));
    setStep(AgentStep.IDLE);
    addLog(`System stable. Virtual runtime active.`);
  };

  const systemCommands = [
    { id: 'plan', name: '/plan', description: 'Re-trigger architectural planning', icon: <Layers size={14}/>, action: startAgentLoop },
    { id: 'deploy', name: '/deploy', description: 'Commit to GitHub and trigger CI/CD', icon: <Github size={14} className="text-white"/>, action: handleGitHubDeployment },
    { id: 'repo', name: '/repo', description: 'Open active GitHub repository', icon: <ExternalLink size={14}/>, action: () => executeSlashCommand('/repo') },
    { id: 'debate', name: '/debate', description: 'Open Debate Console', icon: <GitMerge size={14}/>, action: () => setShowDebate(true) },
    { id: 'reset', name: '/reset', description: 'Wipe state', icon: <RefreshCw size={14}/>, action: () => executeSlashCommand('/reset') },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} commands={systemCommands} />
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3"><Box className="text-blue-500" /><h1 className="font-bold text-sm uppercase">Architect</h1></div>
          <button onClick={toggleLive} className={`p-2 rounded-full transition-all ${isLive ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800'}`}>{isLive ? <MicOff size={16} /> : <Mic size={16} />}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Code size={40} className="mb-4" />
              <div className="text-[10px] font-black uppercase tracking-widest">Awaiting Blueprint</div>
              <div className="text-[9px] mt-2">⌘K for Commands</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-zinc-800 border border-zinc-700/50' : 'bg-blue-500/10 border border-blue-500/20'}`}>
              <div className="text-[8px] font-black uppercase opacity-40 mb-1">{m.role}</div>{m.content}
            </div>
          ))}
        </div>
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); if (e.target.value === '/') setShowCommandPalette(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgentLoop(); } }}
              placeholder="System prompt or /command..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-xs focus:border-blue-500 outline-none h-20 resize-none"
            />
            <button onClick={startAgentLoop} className="absolute bottom-3 right-3 p-1.5 bg-blue-600 rounded text-white"><Send size={14} /></button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Settings settings={settings} setSettings={setSettings} />
        <Editor files={project?.files || []} activeFile={activeFileIdx} setActiveFile={setActiveFileIdx} />
        <Terminal logs={logs} />
      </div>
      <div className="w-96 border-l border-zinc-800 bg-zinc-900/50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Eye size={14} className="text-blue-400" /><span className="text-[10px] font-bold uppercase text-zinc-400">CI/CD Pipeline</span></div>
          {step === AgentStep.DEPLOY && <Loader2 size={14} className="text-blue-500 animate-spin" />}
        </div>
        <div className="flex-1 bg-white rounded-xl overflow-hidden flex flex-col border border-zinc-800 relative shadow-inner">
          <div className="h-6 bg-zinc-100 border-b border-zinc-200 flex items-center px-2 gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-amber-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 p-4 bg-[#f8fafc]">
            {project?.github ? (
              <div className="h-full flex flex-col">
                <div className="p-3 bg-white rounded-lg border border-zinc-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github size={20} className="text-zinc-900" />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">{project.github.repoName}</div>
                        <div className="text-[9px] text-zinc-500 uppercase font-black">GitHub Repository</div>
                      </div>
                    </div>
                    <button onClick={() => window.open(project.github?.url, '_blank')} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors">
                      <ExternalLink size={12} className="text-zinc-600" />
                    </button>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">CI/CD Status</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                        <Globe size={10} className="animate-pulse" /> DEPLOYED
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Actions Runner</span>
                      <span className="text-[10px] font-bold text-zinc-800">MAIN WORKFLOW</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex-1 flex flex-col items-center justify-center text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                    <RefreshCw className="text-blue-500 opacity-20 w-12 h-12" />
                  </motion.div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mt-4">Syncing with Remote Source...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale">
                <Github size={48} />
                <div className="text-xs font-bold">No Repository Linked</div>
                <button 
                  onClick={handleGitHubDeployment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Create Repository
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <DebateVisualizer isOpen={showDebate} onClose={() => setShowDebate(false)} file={project?.files[activeFileIdx] || null} />
    </div>
  );
};
export default App;
