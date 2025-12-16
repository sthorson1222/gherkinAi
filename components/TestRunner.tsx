
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GeneratedFeature, TestRun, TestEnvironment, ExecutionConfig } from '../types.ts';
import { Play, CheckCircle, XCircle, Clock, Terminal as TerminalIcon, Code, X, Tag, Filter, FileText, Image, FileCode, Folder, Download, Sparkles, Send, Wifi, Box, Zap, Settings as SettingsIcon } from 'lucide-react';
import { parseTestCommand } from '../services/geminiService.ts';

interface TestRunnerProps {
  features: GeneratedFeature[];
  activeEnvironment?: TestEnvironment;
  executionConfig: ExecutionConfig;
  onUpdateExecutionConfig: (config: ExecutionConfig) => void;
}

interface ParsedFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'image';
}

export const TestRunner: React.FC<TestRunnerProps> = ({ features, activeEnvironment, executionConfig, onUpdateExecutionConfig }) => {
  const [activeRun, setActiveRun] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  
  const [viewingCodeFeature, setViewingCodeFeature] = useState<GeneratedFeature | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [testQueue, setTestQueue] = useState<GeneratedFeature[]>([]);

  const [command, setCommand] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  
  const [showConfig, setShowConfig] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Code Viewing Logic
  useEffect(() => {
    if (viewingCodeFeature && viewingCodeFeature.stepsCode) {
      const files: ParsedFile[] = [];
      const code = viewingCodeFeature.stepsCode;
      const fileRegex = /\/\/ =+\n\/\/ 📁 (.+)\n\/\/ =+\n([\s\S]*?)(?=\/\/ =+\n\/\/ 📁|$)/g;
      let match;
      let found = false;
      while ((match = fileRegex.exec(code)) !== null) {
        found = true;
        const fullPath = match[1].trim();
        const content = match[2].trim();
        const name = fullPath.split('/').pop() || fullPath;
        files.push({ name, path: fullPath, content, type: 'code' });
      }
      if (!found) {
        files.push({ name: 'steps.ts', path: 'tests/steps/steps.ts', content: code, type: 'code' });
      }
      setParsedFiles(files);
      setActiveFileIndex(0);
    }
  }, [viewingCodeFeature]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    features.forEach(f => {
      const matches = f.content.match(/@[\w-]+/g);
      if (matches) matches.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [features]);

  const filteredFeatures = useMemo(() => {
    if (!selectedTag) return features;
    return features.filter(f => f.content.includes(selectedTag));
  }, [features, selectedTag]);

  // --- ARTIFACT DOWNLOAD LOGIC ---
  const downloadArtifacts = (runId: string) => {
    // If it's a simulation run, generate a client-side report
    if (runId.startsWith('sim-')) {
      const content = `Simulation Report\nRun ID: ${runId}\nTimestamp: ${new Date().toISOString()}\nStatus: Passed\n\n(This is a simulated artifact download)`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-artifacts-${runId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    // Real run: Trigger download from backend
    // Since we can't use window.location.href (it navigates away for JSON responses sometimes), we use a temp link
    const url = `${executionConfig.backendUrl}/api/artifacts/${runId}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = `run-${runId}-artifacts.txt`; // Hint, though backend sets Content-Disposition
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- REAL EXECUTION LOGIC ---
  const runRealTest = async (feature: GeneratedFeature, tags: string[]) => {
      setActiveRun(feature.id);
      setLogs(prev => [...prev, `🚀 Starting REAL Execution for: ${feature.title}`]);
      setLogs(prev => [...prev, `⚙️  Method: ${executionConfig.executionMethod === 'docker' ? 'Docker Container' : 'Local Host Process'}`]);
      if(executionConfig.executionMethod === 'docker') {
          setLogs(prev => [...prev, `🐳 Container: ${executionConfig.containerName}`]);
      }
      setLogs(prev => [...prev, `📡 Connecting to Control Plane: ${executionConfig.backendUrl}...`]);

      const startTime = Date.now();
      
      try {
          const response = await fetch(`${executionConfig.backendUrl}/api/run`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  featureTitle: feature.title,
                  featureCode: feature.content,
                  stepsCode: feature.stepsCode,
                  tags: tags,
                  executionMode: executionConfig.executionMethod,
                  containerName: executionConfig.containerName
              })
          });

          if (!response.ok) {
              throw new Error(`Control Plane Error: ${response.statusText}`);
          }
          if (!response.body) {
             throw new Error("No response stream received");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(Boolean);
              setLogs(prev => [...prev, ...lines]);
          }

          const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
          setRuns(prev => [{ id: `real-${Date.now()}`, feature: feature.title, status: 'passed', duration, timestamp: new Date().toLocaleTimeString() }, ...prev]);

      } catch (err) {
          setLogs(prev => [...prev, `❌ Execution Failed: ${(err as Error).message}`]);
          setRuns(prev => [{ id: `real-${Date.now()}`, feature: feature.title, status: 'failed', duration: '0s', timestamp: new Date().toLocaleTimeString() }, ...prev]);
      } finally {
          setActiveRun(null);
      }
  };

  const runTest = useCallback((feature: GeneratedFeature, tags: string[] = [], dryRun: boolean = false) => {
    if (activeRun) return;

    if (executionConfig.mode === 'real' && !dryRun) {
        runRealTest(feature, tags);
        return;
    }

    // --- SIMULATION LOGIC ---
    const envName = activeEnvironment?.name || 'Local Dev';
    const envUrl = activeEnvironment?.url || 'http://localhost:3000';

    setActiveRun(feature.id);
    setLogs(prev => [...prev, `----------------------------------------`]);
    setLogs(prev => [...prev, `> [SIMULATION] Initializing Playwright runner for: ${feature.title}...`]);
    
    if (dryRun) {
        setLogs(prev => [...prev, `> [DRY RUN] Simulation mode active. Skipping execution delays.`]);
        setLogs(prev => [...prev, `> Dry run completed. Plan validated.`]);
        setActiveRun(null);
        return;
    }

    if(tags.length > 0) setLogs(prev => [...prev, `> Applied Tags: ${tags.join(', ')}`]);
    setLogs(prev => [...prev, `> Target Environment: ${envName} (${envUrl})`]);

    const sequence = [
        { delay: 500, log: `> docker-compose exec playwright cucumber-js` },
        { delay: 1000, log: `Running: ${feature.title}` },
        { delay: 2000, log: `> Given steps... OK` },
        { delay: 3000, log: `> When actions... OK` },
        { delay: 4000, log: `> Then assertions... PASSED` },
        { delay: 4500, log: `Done in 4.5s.` },
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];
    sequence.forEach(({ delay, log }) => {
      const t = setTimeout(() => setLogs(prev => [...prev, log]), delay);
      timeouts.push(t);
    });

    const finalT = setTimeout(() => {
      setActiveRun(null);
      setRuns(prev => [{ id: `sim-${Date.now()}`, feature: feature.title, status: 'passed', duration: '4.5s', timestamp: new Date().toLocaleTimeString() }, ...prev]);
    }, 5000);
    timeouts.push(finalT);

    return () => timeouts.forEach(clearTimeout);
  }, [activeRun, activeEnvironment, executionConfig]);

  // Queue and AI Command Logic
  useEffect(() => {
    if (!activeRun && testQueue.length > 0) {
      const nextFeature = testQueue[0];
      setTestQueue(prev => prev.slice(1));
      runTest(nextFeature);
    }
  }, [activeRun, testQueue, runTest]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setIsProcessingCommand(true);
    setAiFeedback("Analyzing command...");
    try {
        const result = await parseTestCommand(command);
        if (result.kind === 'TOOL_CALL' && result.toolName === 'runTestExecution') {
            const { scenario, tags, dryRun } = result.args;
            const matchedFeature = features.find(f => f.title.toLowerCase().includes(scenario.toLowerCase()));
            if (matchedFeature) {
                setAiFeedback(`Executing: "${matchedFeature.title}"`);
                runTest(matchedFeature, tags, dryRun);
                setCommand('');
            } else {
                setAiFeedback(`⚠️ Feature not found: "${scenario}"`);
            }
        } else if (result.kind === 'TEXT') {
            setAiFeedback(`🤖 ${result.text}`);
        }
    } catch (err) {
        setAiFeedback("❌ Error processing command.");
    } finally {
        setIsProcessingCommand(false);
        setTimeout(() => !activeRun && setAiFeedback(null), 5000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative">
      {/* Code Viewer (hidden) */}
      {viewingCodeFeature && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-slate-800 w-full max-w-6xl h-full rounded-xl border border-slate-700 flex flex-col">
              <div className="flex justify-between p-4 border-b border-slate-700">
                 <span className="text-white font-mono">{viewingCodeFeature.title}</span>
                 <button onClick={() => setViewingCodeFeature(null)}><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                 <pre className="text-blue-300 font-mono text-sm">{viewingCodeFeature.stepsCode || viewingCodeFeature.content}</pre>
              </div>
           </div>
        </div>
      )}

      {/* Feature List */}
      <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-700">
             <div className="mb-4">
                 <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs font-bold px-2 py-1 rounded border flex items-center gap-1 ${executionConfig.mode === 'real' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                        {executionConfig.mode === 'real' ? (executionConfig.executionMethod === 'docker' ? <Box size={10} /> : <Wifi size={10} />) : <Zap size={10} />}
                        {executionConfig.mode === 'real' ? (executionConfig.executionMethod === 'docker' ? 'DOCKER' : 'HOST') : 'SIMULATED'}
                    </div>
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`p-1.5 rounded transition-colors ${showConfig ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Configure Execution"
                    >
                        <SettingsIcon size={14} />
                    </button>
                 </div>

                 {showConfig && (
                    <div className="mb-4 p-3 bg-slate-950/50 rounded-lg border border-slate-700 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
                         {/* Mode Toggle */}
                         <div className="flex gap-2">
                            <button 
                               onClick={() => onUpdateExecutionConfig({...executionConfig, mode: 'simulated'})}
                               className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 border ${executionConfig.mode === 'simulated' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            >
                                <Zap size={12} /> Sim
                            </button>
                            <button 
                               onClick={() => onUpdateExecutionConfig({...executionConfig, mode: 'real'})}
                               className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 border ${executionConfig.mode === 'real' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            >
                                <Play size={12} /> Real
                            </button>
                         </div>

                         {executionConfig.mode === 'real' && (
                            <>
                                <div className="flex gap-2">
                                    <button 
                                       onClick={() => onUpdateExecutionConfig({...executionConfig, executionMethod: 'host'})}
                                       className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 border ${executionConfig.executionMethod === 'host' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        <Wifi size={12} /> Host
                                    </button>
                                    <button 
                                       onClick={() => onUpdateExecutionConfig({...executionConfig, executionMethod: 'docker'})}
                                       className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 border ${executionConfig.executionMethod === 'docker' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        <Box size={12} /> Docker
                                    </button>
                                </div>
                                
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div>
                                        <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Backend URL</label>
                                        <input 
                                            type="text" 
                                            value={executionConfig.backendUrl}
                                            onChange={(e) => onUpdateExecutionConfig({...executionConfig, backendUrl: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    {executionConfig.executionMethod === 'docker' && (
                                         <div>
                                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Container Name</label>
                                            <input 
                                                type="text" 
                                                value={executionConfig.containerName}
                                                onChange={(e) => onUpdateExecutionConfig({...executionConfig, containerName: e.target.value})}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                         )}
                    </div>
                 )}
             </div>

             <form onSubmit={handleCommandSubmit} className="relative">
                <Sparkles className={`absolute left-3 top-3 ${isProcessingCommand ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} size={16} />
                <input 
                   type="text" 
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                   placeholder="Ask AI to run a test..."
                   value={command}
                   onChange={(e) => setCommand(e.target.value)}
                   disabled={isProcessingCommand}
                />
                <button type="submit" className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"><Send size={16} /></button>
             </form>
             {aiFeedback && <div className="mt-2 text-xs text-purple-300 bg-purple-500/10 p-2 rounded">{aiFeedback}</div>}
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredFeatures.map(f => (
                <div key={f.id} className={`p-4 rounded-lg border transition-all ${activeRun === f.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700/30 border-slate-700 hover:border-slate-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-200 truncate pr-2">{f.title}</h4>
                        <div className="flex gap-1">
                            <button onClick={() => setViewingCodeFeature(f)} className="p-1.5 bg-slate-600 rounded text-slate-300"><Code size={14} /></button>
                            <button onClick={() => runTest(f)} disabled={!!activeRun} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50">
                                <Play size={14} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">{f.content.substring(0, 40)}...</p>
                </div>
            ))}
        </div>
      </div>

      {/* Right Column: Console & History */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
        {/* Console Section */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col flex-[2] shadow-inner overflow-hidden font-mono text-sm relative min-h-0">
           <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <TerminalIcon size={14} className="text-slate-400" />
                 <span className="text-slate-400 text-xs">
                     Console Output {executionConfig.mode === 'real' ? (executionConfig.executionMethod === 'docker' ? '(Docker Stream)' : '(Host Stream)') : '(Simulated)'}
                 </span>
              </div>
              {activeRun && <span className="text-xs text-blue-400 animate-pulse">● Running...</span>}
           </div>
           <div className="p-4 overflow-y-auto flex-1 text-slate-300">
             {logs.length === 0 ? <span className="text-slate-600 italic">Ready to execute.</span> : logs.map((log, i) => <div key={i} className="mb-1 break-all whitespace-pre-wrap">{log}</div>)}
             <div ref={bottomRef} />
           </div>
        </div>

        {/* History Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col flex-1 overflow-hidden min-h-0">
             <div className="px-4 py-2 bg-slate-900 border-b border-slate-700 font-semibold text-white text-sm flex items-center gap-2">
                <Clock size={14} className="text-blue-400" /> Execution History
             </div>
             <div className="overflow-y-auto p-0">
                <table className="w-full text-left text-sm text-slate-400">
                   <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500 sticky top-0 z-10">
                      <tr>
                         <th className="px-4 py-2">Status</th>
                         <th className="px-4 py-2">Feature</th>
                         <th className="px-4 py-2">Duration</th>
                         <th className="px-4 py-2">Time</th>
                         <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700">
                      {runs.map(run => (
                         <tr key={run.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-2">
                               {run.status === 'passed' ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                            </td>
                            <td className="px-4 py-2 text-slate-200 font-medium">{run.feature}</td>
                            <td className="px-4 py-2 font-mono text-xs text-slate-500">{run.duration}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{run.timestamp}</td>
                            <td className="px-4 py-2 text-right">
                               <button 
                                 onClick={() => downloadArtifacts(run.id)} 
                                 className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors" 
                                 title="Download Report & Screenshots"
                               >
                                  <Download size={12} /> Artifacts
                               </button>
                            </td>
                         </tr>
                      ))}
                      {runs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-600 text-xs">
                                No test executions recorded yet. Run a test to see history.
                            </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
        </div>
      </div>
    </div>
  );
};
