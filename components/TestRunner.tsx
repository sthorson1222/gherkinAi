
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GeneratedFeature, TestRun, TestEnvironment } from '../types';
import { Play, CheckCircle, XCircle, Clock, Terminal as TerminalIcon, AlertTriangle, Code, X, Tag, Filter, Layers, Square, FileText, AlertOctagon, Image, FileCode, Folder, Download, Eye, ChevronRight, ChevronDown } from 'lucide-react';

interface TestRunnerProps {
  features: GeneratedFeature[];
  activeEnvironment?: TestEnvironment;
}

interface ParsedFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'image';
}

export const TestRunner: React.FC<TestRunnerProps> = ({ features, activeEnvironment }) => {
  const [activeRun, setActiveRun] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  // Clean state: No past runs
  const [runs, setRuns] = useState<TestRun[]>([]);
  
  const [viewingCodeFeature, setViewingCodeFeature] = useState<GeneratedFeature | null>(null);
  const [inspectingRun, setInspectingRun] = useState<TestRun | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // State for the Tabbed Code Viewer
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Queue for batch execution
  const [testQueue, setTestQueue] = useState<GeneratedFeature[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Parse files when viewing code changes
  useEffect(() => {
    if (viewingCodeFeature && viewingCodeFeature.stepsCode) {
      const files: ParsedFile[] = [];
      const code = viewingCodeFeature.stepsCode;
      
      // Regex to find headers like: // 📁 tests/pages/LoginPage.ts
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
        // Fallback for legacy format without headers
        files.push({
          name: 'steps.ts',
          path: 'tests/steps/steps.ts',
          content: code,
          type: 'code'
        });
      }

      // SIMULATION: Inject Artifacts Folder for User Login
      if (viewingCodeFeature.title === 'User Login' || viewingCodeFeature.id === 'default-1') {
         files.push({
             name: '1-landing-page.png',
             path: 'test-results/1-landing-page.png',
             content: 'https://placehold.co/800x600/1e293b/475569?text=Landing+Page+Screenshot&font=roboto',
             type: 'image'
         });
         files.push({
             name: '2-dashboard-signed-in.png',
             path: 'test-results/2-dashboard-signed-in.png',
             content: 'https://placehold.co/800x600/1e293b/22c55e?text=Dashboard+Authenticated&font=roboto',
             type: 'image'
         });
      }
      
      setParsedFiles(files);
      setActiveFileIndex(0);
    }
  }, [viewingCodeFeature]);

  // Extract unique tags from all features
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    features.forEach(f => {
      const matches = f.content.match(/@[\w-]+/g);
      if (matches) {
        matches.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [features]);

  // Filter features based on selection
  const filteredFeatures = useMemo(() => {
    if (!selectedTag) return features;
    return features.filter(f => f.content.includes(selectedTag));
  }, [features, selectedTag]);

  // Helper to determine if a variable is sensitive
  const isSensitive = (key: string): boolean => {
    const sensitivePatterns = /PASS|KEY|SECRET|TOKEN|CREDENTIAL|PWD|AUTH|SIGNATURE/i;
    return sensitivePatterns.test(key);
  };

  const getMockLogsForRun = (run: TestRun): string[] => {
    // Custom logs for User Login history to match execution
    if (run.feature === 'User Login') {
        return [
            `> Initializing Playwright runner for: User Login...`,
            `> Target Environment: ${activeEnvironment?.name || 'House QA Portal'}`,
            `> Injecting Environment Variables:`,
            `  - TEST_USER: ehoptester1@devmail.house.gov`,
            `  - TEST_PASSWORD: HopT...07`,
            `> docker-compose exec playwright cucumber-js --tags "@default-1"`,
            `Found 1 feature(s)...`,
            `Running: User Login`,
            `> Given I verify the browser is open and loaded`,
            `  🚀 Launching browser and navigating to: https://lims2qa.house.gov`,
            `  📸 Screenshot saved: 1-landing-page.png`,
            `  ✅ Browser Validated | URL: https://lims2qa.house.gov/login`,
            `  📑 Page Title: Sign in to your account`,
            `> When I perform the secure login sequence`,
            `  ⌨️ Filling credentials...`,
            `  📸 Screenshot saved: 2-dashboard-signed-in.png`,
            `> Then I should be fully authenticated`,
            `  ✅ Dashboard loaded successfully`,
            `1 scenario (1 passed)`,
            `3 steps (3 passed)`,
            `Done in ${run.duration}.`
        ];
    }

    // Generic Logs for other features
    return [
        `> Initializing Playwright runner for: ${run.feature}...`,
        `> Target Environment: ${activeEnvironment?.name || 'Local Dev'}`,
        `> docker-compose exec playwright cucumber-js --tags "@run-${run.id.slice(-4)}"`,
        `Found 1 feature(s)...`,
        `Running: ${run.feature}`,
        `................`,
        `> Given the application is loaded`,
        `  🌐 Navigating to base URL`,
        `> When I perform the specified action`,
        `  ⚡ interacting with elements...`,
        `> Then the expected outcome should occur`,
        `  ✅ Assertion passed`,
        `1 scenario (1 passed)`,
        `3 steps (3 passed)`,
        `Done in ${run.duration}.`
    ];
  };

  const runTest = useCallback((feature: GeneratedFeature) => {
    if (activeRun) return;

    const envName = activeEnvironment?.name || 'Local Dev';
    const envUrl = activeEnvironment?.url || 'http://localhost:3000';

    setActiveRun(feature.id);
    setLogs(prev => [...prev, `----------------------------------------`]);
    setLogs(prev => [...prev, `> Initializing Playwright runner for: ${feature.title}...`]);
    setLogs(prev => [...prev, `> Target Environment: ${envName} (${envUrl})`]);

    // Inject Variables Logs
    if (activeEnvironment?.variables && activeEnvironment.variables.length > 0) {
       setLogs(prev => [...prev, `> Injecting Environment Variables:`]);
       activeEnvironment.variables.forEach(v => {
           let displayValue = v.value;
           if (isSensitive(v.key)) {
             if (v.value.length > 8) {
               displayValue = `${v.value.substring(0, 4)}...${v.value.substring(v.value.length - 2)}`;
             } else {
               displayValue = '********';
             }
           }
           setLogs(prev => [...prev, `  - ${v.key}: ${displayValue}`]);
       });
    }

    // Determine simulation sequence based on feature
    let sequence;

    if (feature.title === 'User Login' || feature.id === 'default-1') {
        sequence = [
            { delay: 800, log: `> docker-compose exec playwright cucumber-js --tags "@${feature.id}"` },
            { delay: 1500, log: `Found 1 feature(s)...` },
            { delay: 2000, log: `Running: ${feature.title}` },
            { delay: 2500, log: `> Given I verify the browser is open and loaded` },
            { delay: 2800, log: `  🚀 Launching browser and navigating to: ${activeEnvironment?.url || 'https://lims2qa.house.gov'}` },
            { delay: 3500, log: `  📸 Screenshot saved: 1-landing-page.png` },
            { delay: 3800, log: `  ✅ Browser Validated | URL: ${activeEnvironment?.url}/login` },
            { delay: 3800, log: `  📑 Page Title: Sign in to your account` },
            { delay: 4200, log: `> When I perform the secure login sequence` },
            { delay: 4500, log: `  ⌨️ Filling credentials...` },
            { delay: 5500, log: `  📸 Screenshot saved: 2-dashboard-signed-in.png` },
            { delay: 5800, log: `> Then I should be fully authenticated` },
            { delay: 6000, log: `  ✅ Dashboard loaded successfully` },
            { delay: 6200, log: `1 scenario (1 passed)` },
            { delay: 6500, log: `Done in 4.2s.` },
        ];
    } else {
        // Generic Simulation
        sequence = [
            { delay: 800, log: `> docker-compose exec playwright cucumber-js --tags "@${feature.id}"` },
            { delay: 1500, log: `Found 1 feature(s)...` },
            { delay: 2000, log: `Running: ${feature.title}` },
            { delay: 2500, log: `> Given precondition steps are met` },
            { delay: 2800, log: `  🌐 Navigate and setup state` },
            { delay: 3500, log: `> When actions are performed` },
            { delay: 3800, log: `  ⚡ Executing steps...` },
            { delay: 4500, log: `> Then assertions should pass` },
            { delay: 4800, log: `  ✅ All checks passed` },
            { delay: 5000, log: `1 scenario (1 passed)` },
            { delay: 5200, log: `Done in 2.5s.` },
        ];
    }

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    sequence.forEach(({ delay, log }) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, delay);
      timeouts.push(t);
    });

    // Finish
    const finalDelay = sequence[sequence.length - 1].delay + 500;
    const finalT = setTimeout(() => {
      setActiveRun(null);
      const newRun: TestRun = {
        id: `run-${Date.now()}`,
        feature: feature.title,
        status: 'passed',
        duration: feature.title === 'User Login' ? '4.2s' : '2.5s',
        timestamp: 'Just now'
      };
      setRuns(prev => [newRun, ...prev]);
    }, finalDelay);
    timeouts.push(finalT);

    return () => timeouts.forEach(clearTimeout);
  }, [activeRun, activeEnvironment]);

  // Queue Processing Effect
  useEffect(() => {
    if (!activeRun && testQueue.length > 0) {
      const nextFeature = testQueue[0];
      setTestQueue(prev => prev.slice(1));
      runTest(nextFeature);
    }
  }, [activeRun, testQueue, runTest]);

  const handleRunAll = () => {
    const featuresToRun = filteredFeatures.filter(f => f.id !== activeRun);
    setTestQueue(featuresToRun);
  };

  const handleCancelQueue = () => {
    setTestQueue([]);
  };

  // Helper to extract screenshots from logs
  const getScreenshotsFromLogs = (logLines: string[]) => {
    return logLines
      .filter(line => line.includes('Screenshot saved:'))
      .map(line => line.split('Screenshot saved:')[1].trim());
  };

  const hasArtifacts = (run: TestRun) => {
    return getScreenshotsFromLogs(getMockLogsForRun(run)).length > 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative">
      {/* Code Viewer Modal with Tabs */}
      {viewingCodeFeature && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
           <div className="bg-slate-800 w-full max-w-6xl h-full max-h-[85vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-500/10 rounded">
                     <Code size={18} className="text-blue-400" />
                   </div>
                   <div>
                      <h3 className="text-white font-semibold text-sm">Automation Code & Artifacts</h3>
                      <p className="text-xs text-slate-400">{viewingCodeFeature.title}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setViewingCodeFeature(null)}
                   className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                  {/* File Explorer Sidebar */}
                  <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
                      <div className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Folder size={12} /> Project Explorer
                      </div>
                      <div className="flex-1 overflow-y-auto py-2">
                          {parsedFiles.map((file, idx) => {
                             const isImage = file.type === 'image';
                             const isTestResult = file.path.startsWith('test-results/');
                             
                             return (
                              <button
                                key={idx}
                                onClick={() => setActiveFileIndex(idx)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors border-l-2 group ${
                                    activeFileIndex === idx 
                                    ? 'bg-slate-800 text-blue-400 border-blue-500' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                                }`}
                              >
                                  {isImage ? (
                                      <Image size={14} className={activeFileIndex === idx ? 'text-purple-400' : 'text-purple-500/50'} />
                                  ) : (
                                      <FileCode size={14} className={activeFileIndex === idx ? 'text-blue-400' : 'text-slate-500'} />
                                  )}
                                  <div className="flex flex-col truncate">
                                      <span className="truncate">{file.name}</span>
                                      {isTestResult && <span className="text-[10px] text-slate-600 font-mono">test-results/</span>}
                                  </div>
                              </button>
                             );
                          })}
                      </div>
                  </div>

                  {/* Code Content */}
                  <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
                      <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
                          <span>{parsedFiles[activeFileIndex]?.path}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed">
                          {parsedFiles.length > 0 ? (
                            parsedFiles[activeFileIndex].type === 'image' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900/50">
                                    <div className="relative group border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
                                        <img 
                                            src={parsedFiles[activeFileIndex].content} 
                                            alt={parsedFiles[activeFileIndex].name} 
                                            className="max-w-full max-h-[60vh] object-contain" 
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                                <Download size={16} /> Download
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-slate-500 text-xs">Generated Artifact</p>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <pre className="text-blue-100">
                                        {parsedFiles[activeFileIndex].content.split('\n').map((line, i) => (
                                            <div key={i} className="table-row">
                                                <span className="table-cell text-right pr-4 text-slate-700 select-none w-8">{i + 1}</span>
                                                <span className="table-cell">{line}</span>
                                            </div>
                                        ))}
                                    </pre>
                                </div>
                            )
                          ) : (
                             <div className="text-slate-500 italic flex items-center justify-center h-full">
                                No content available.
                             </div>
                          )}
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Run Inspector Modal */}
      {inspectingRun && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
           <div className="bg-slate-800 w-full max-w-3xl h-full max-h-[90vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
                 <div className="flex items-center gap-3">
                    {inspectingRun.status === 'failed' ? (
                       <AlertOctagon className="text-red-500" size={24} />
                    ) : (
                       <CheckCircle className="text-green-500" size={24} />
                    )}
                    <div>
                        <h3 className="text-white font-semibold">Run Details: {inspectingRun.feature}</h3>
                        <p className="text-xs text-slate-400">{inspectingRun.timestamp} • Duration: {inspectingRun.duration}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setInspectingRun(null)}
                   className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0 bg-slate-950 font-mono text-sm">
                 <div className="p-4 space-y-1">
                    {getMockLogsForRun(inspectingRun).map((line, i) => (
                        <div key={i} className={`break-all whitespace-pre-wrap ${
                            line.includes('Error:') || line.includes('FAILED') || line.includes('Failures:') 
                            ? 'text-red-400 font-bold' 
                            : 'text-slate-300'
                        }`}>
                            {line}
                        </div>
                    ))}
                 </div>

                 {/* Artifacts / Screenshots Section */}
                 {getScreenshotsFromLogs(getMockLogsForRun(inspectingRun)).length > 0 && (
                     <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                           <Image size={16} className="text-purple-400" />
                           Test Artifacts
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                           {getScreenshotsFromLogs(getMockLogsForRun(inspectingRun)).map((img, idx) => (
                             <div key={idx} className="group relative bg-slate-800 rounded-lg border border-slate-700 p-2 hover:border-blue-500 transition-colors">
                                <div className="aspect-video bg-slate-950 rounded flex items-center justify-center mb-2 overflow-hidden relative">
                                    {/* Mock Image Placeholder */}
                                    <div className="text-slate-600 flex flex-col items-center">
                                       <Image size={24} className="mb-1 opacity-50" />
                                       <span className="text-[10px]">{img}</span>
                                    </div>
                                    {/* Simulated Image Content */}
                                    <img 
                                        src={`https://placehold.co/600x400/1e293b/64748b?text=${encodeURIComponent(img)}`} 
                                        className="absolute inset-0 w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                        <button className="p-1.5 bg-slate-700 text-white rounded hover:bg-blue-600 transition-colors" title="View">
                                           <Eye size={16} />
                                        </button>
                                        <button className="p-1.5 bg-slate-700 text-white rounded hover:bg-green-600 transition-colors" title="Download">
                                           <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 truncate font-mono px-1">
                                   {img}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Feature List */}
      <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white">Available Features</h3>
            <div className="flex items-center gap-2">
               {/* Run All Button */}
               {filteredFeatures.length > 0 && (
                   <button 
                      onClick={testQueue.length > 0 ? handleCancelQueue : handleRunAll}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                         testQueue.length > 0 
                           ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                           : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                      }`}
                      title={testQueue.length > 0 ? "Stop Sequence" : `Run all ${filteredFeatures.length} tests sequentially`}
                   >
                      {testQueue.length > 0 ? <Square size={12} fill="currentColor" /> : <Layers size={12} />}
                      {testQueue.length > 0 ? `Stop (${testQueue.length})` : 'Run All'}
                   </button>
               )}
               <span className="bg-slate-700 px-2 py-0.5 rounded-full text-slate-300 text-xs">{filteredFeatures.length}</span>
            </div>
          </div>
          
          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
               <Filter size={14} className="text-slate-500 shrink-0" />
               <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                    selectedTag === null 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                  }`}
               >
                 All
               </button>
               {availableTags.map(tag => (
                 <button
                   key={tag}
                   onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                   className={`text-xs px-2 py-1 rounded-md transition-colors whitespace-nowrap border ${
                     selectedTag === tag 
                       ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                       : 'bg-slate-700/50 text-slate-400 border-transparent hover:bg-slate-600'
                   }`}
                 >
                   {tag}
                 </button>
               ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {features.length === 0 ? (
             <div className="text-center p-8 text-slate-500">
               <AlertTriangle className="mx-auto mb-2 opacity-50" />
               <p>No features generated yet.</p>
               <p className="text-xs">Go to Generator to create tests.</p>
             </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              <Tag className="mx-auto mb-2 opacity-50" />
              <p>No features match tag <span className="text-slate-400">"{selectedTag}"</span></p>
              <button onClick={() => setSelectedTag(null)} className="text-xs text-blue-400 hover:underline mt-2">Clear Filter</button>
            </div>
          ) : (
            filteredFeatures.map(f => {
              // Get tags for this specific feature to display
              const featureTags = f.content.match(/@[\w-]+/g) || [];
              const isQueued = testQueue.some(q => q.id === f.id);
              
              return (
                <div key={f.id} className={`p-4 rounded-lg border transition-all group ${
                    activeRun === f.id 
                    ? 'bg-blue-900/20 border-blue-500/50' 
                    : isQueued
                        ? 'bg-slate-700/50 border-slate-600 border-dashed opacity-70'
                        : 'bg-slate-700/30 border-slate-700 hover:border-blue-500/50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-medium truncate pr-2 ${activeRun === f.id ? 'text-blue-400' : 'text-slate-200'}`}>
                        {f.title}
                    </h4>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setViewingCodeFeature(f)}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-all"
                        title="View Code"
                      >
                        <Code size={14} />
                      </button>
                      <button 
                        onClick={() => runTest(f)}
                        disabled={activeRun !== null}
                        className={`p-1.5 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:scale-110 ${
                            activeRun === f.id ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                        title="Run Test"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Feature Tags Display */}
                  {featureTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {featureTags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-purple-300 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 font-mono truncate">{f.content.substring(0, 40)}...</p>
                  
                  {isQueued && (
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> Queued for execution...
                      </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Terminal & Logs */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col flex-1 shadow-inner overflow-hidden font-mono text-sm relative">
           <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <TerminalIcon size={14} className="text-slate-400" />
                 <span className="text-slate-400 text-xs">Playwright Console Output</span>
              </div>
              <div className="flex items-center gap-4">
                  {activeEnvironment && (
                     <span className="text-xs text-slate-500">Target: <span className="text-blue-400">{activeEnvironment.name}</span></span>
                  )}
                  {activeRun && <span className="text-xs text-blue-400 animate-pulse">● Running...</span>}
              </div>
           </div>
           <div className="p-4 overflow-y-auto flex-1 text-slate-300">
             {logs.length === 0 ? (
               <span className="text-slate-600 italic">Ready to execute. Select a feature to start run.</span>
             ) : (
               logs.map((log, i) => (
                 <div key={i} className="mb-1 break-all whitespace-pre-wrap">{log}</div>
               ))
             )}
             <div ref={bottomRef} />
           </div>
        </div>

        {/* Recent Runs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden h-64 flex flex-col">
           <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
             <h3 className="font-semibold text-white text-sm">Recent Runs</h3>
           </div>
           <div className="overflow-y-auto flex-1">
             {runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                   <Clock size={24} className="opacity-20" />
                   <span className="text-xs">No execution history</span>
                </div>
             ) : (
               <table className="w-full text-sm">
                 <thead className="bg-slate-900/30 text-slate-400 text-xs text-left">
                   <tr>
                      <th className="px-4 py-2 font-normal">Status</th>
                      <th className="px-4 py-2 font-normal">Feature</th>
                      <th className="px-4 py-2 font-normal">Duration</th>
                      <th className="px-4 py-2 font-normal">Time</th>
                      <th className="px-4 py-2 font-normal text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700/50">
                   {runs.map(run => (
                     <tr 
                       key={run.id} 
                       onClick={() => setInspectingRun(run)}
                       className="hover:bg-slate-700/30 cursor-pointer transition-colors group"
                     >
                       <td className="px-4 py-3">
                         {run.status === 'passed' ? (
                           <span className="flex items-center gap-1.5 text-green-400 text-xs bg-green-500/10 px-2 py-0.5 rounded-full w-fit border border-green-500/20">
                             <CheckCircle size={12} /> Passed
                           </span>
                         ) : (
                           <span className="flex items-center gap-1.5 text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full w-fit border border-red-500/20">
                             <XCircle size={12} /> Failed
                           </span>
                         )}
                       </td>
                       <td className="px-4 py-3 text-slate-200 font-medium">{run.feature}</td>
                       <td className="px-4 py-3 text-slate-400 font-mono text-xs">{run.duration}</td>
                       <td className="px-4 py-3 text-slate-500 text-xs flex items-center gap-1">
                         <Clock size={10} /> {run.timestamp}
                       </td>
                       <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3 transition-opacity">
                             {hasArtifacts(run) && (
                                <span className="text-xs text-purple-400 flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded hover:bg-purple-500/20" title="Has Artifacts">
                                   <Image size={12} /> Artifacts
                                </span>
                             )}
                             <span className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
                                <FileText size={12} /> Logs
                             </span>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
