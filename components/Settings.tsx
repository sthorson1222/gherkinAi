
import React, { useState } from 'react';
import { TestEnvironment, ExecutionConfig } from '../types.ts';
import { Plus, Trash2, Globe, Server, Settings as SettingsIcon, Database, X, Edit2, Check, Eye, EyeOff, Zap, Play, Terminal, Box, Copy, Info } from 'lucide-react';

interface SettingsProps {
  environments: TestEnvironment[];
  onUpdateEnvironments: (envs: TestEnvironment[]) => void;
  executionConfig: ExecutionConfig;
  onUpdateExecutionConfig: (config: ExecutionConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  environments, 
  onUpdateEnvironments,
  executionConfig,
  onUpdateExecutionConfig
}) => {
  const [newEnvName, setNewEnvName] = useState('');
  
  // Existing environment handlers...
  const handleSetActive = (id: string) => {
    onUpdateEnvironments(environments.map(e => ({ ...e, active: e.id === id })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Execution Engine Settings */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
             <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Terminal size={24} className="text-purple-400" />
                Execution Engine
            </h2>
            <div className="space-y-6">
                
                {/* Mode Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Operation Mode</label>
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700 max-w-md">
                        <button 
                            onClick={() => onUpdateExecutionConfig({ ...executionConfig, mode: 'simulated' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                executionConfig.mode === 'simulated' 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Zap size={16} /> Simulation
                        </button>
                        <button 
                             onClick={() => onUpdateExecutionConfig({ ...executionConfig, mode: 'real' })}
                             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                executionConfig.mode === 'real' 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Play size={16} /> Real Execution
                        </button>
                    </div>
                </div>

                {/* Real Execution Settings (Conditional) */}
                {executionConfig.mode === 'real' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Execution Environment</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onUpdateExecutionConfig({ ...executionConfig, executionMethod: 'host' })}
                                            className={`px-4 py-2 rounded text-sm border flex items-center gap-2 ${
                                                executionConfig.executionMethod === 'host' 
                                                ? 'bg-slate-700 border-slate-500 text-white' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            <Server size={14} /> Host Process
                                        </button>
                                        <button 
                                            onClick={() => onUpdateExecutionConfig({ ...executionConfig, executionMethod: 'docker' })}
                                            className={`px-4 py-2 rounded text-sm border flex items-center gap-2 ${
                                                executionConfig.executionMethod === 'docker' 
                                                ? 'bg-slate-700 border-slate-500 text-white' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            <Box size={14} /> Docker Container
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Control Plane URL</label>
                                    <div className="relative">
                                        <Server className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                        <input 
                                            type="text" 
                                            value={executionConfig.backendUrl}
                                            onChange={(e) => onUpdateExecutionConfig({ ...executionConfig, backendUrl: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {executionConfig.executionMethod === 'docker' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Container Name</label>
                                    <div className="relative max-w-md">
                                        <Box className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                        <input 
                                            type="text" 
                                            value={executionConfig.containerName}
                                            onChange={(e) => onUpdateExecutionConfig({ ...executionConfig, containerName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. playwright-runner"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Setup Guide */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                            <h4 className="text-blue-400 font-medium flex items-center gap-2 mb-2">
                                <Info size={16} /> Infrastructure Setup
                            </h4>
                            <p className="text-sm text-slate-400 mb-3">
                                To enable Docker execution, you must run the infrastructure using Docker Compose. This creates the Control Plane and the Runner containers in a shared network.
                            </p>
                            <div className="bg-slate-950 rounded p-3 font-mono text-xs text-slate-300 border border-slate-800 flex justify-between items-center group">
                                <code>docker-compose up -d --build</code>
                                <button className="text-slate-500 hover:text-white" onClick={() => navigator.clipboard.writeText('docker-compose up -d --build')}><Copy size={14} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Environments Config */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Globe size={24} className="text-blue-400" />
                Target Environments
            </h2>
            <div className="space-y-4">
                {environments.map(env => (
                    <div key={env.id} className={`rounded-lg border transition-all ${env.active ? 'bg-blue-500/5 border-blue-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                              <div onClick={() => handleSetActive(env.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${env.active ? 'border-blue-500' : 'border-slate-500'}`}>
                                  {env.active && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                              </div>
                              <div>
                                  <h4 className={`font-medium ${env.active ? 'text-blue-400' : 'text-slate-200'}`}>{env.name}</h4>
                                  <div className="text-xs text-slate-500 font-mono mt-1">{env.url}</div>
                              </div>
                          </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
