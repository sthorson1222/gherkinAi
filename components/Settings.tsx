
import React, { useState } from 'react';
import { TestEnvironment } from '../types';
import { Plus, Trash2, Globe, Server, Settings as SettingsIcon, Database, X, Edit2, Check, Eye, EyeOff } from 'lucide-react';

interface SettingsProps {
  environments: TestEnvironment[];
  onUpdateEnvironments: (envs: TestEnvironment[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ environments, onUpdateEnvironments }) => {
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // State for adding a new variable
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  // State for editing an existing variable
  const [editingVar, setEditingVar] = useState<{ envId: string, key: string } | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  // Visibility state for masking values
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});

  const toggleVisibility = (envId: string, key: string) => {
    const compositeKey = `${envId}-${key}`;
    setVisibleValues(prev => ({
      ...prev,
      [compositeKey]: !prev[compositeKey]
    }));
  };

  const handleAdd = () => {
    if (newEnvName && newEnvUrl) {
      const newEnv: TestEnvironment = {
        id: Date.now().toString(),
        name: newEnvName,
        url: newEnvUrl,
        active: false,
        variables: []
      };
      // If it's the first environment, make it active by default
      if (environments.length === 0) {
        newEnv.active = true;
      }
      onUpdateEnvironments([...environments, newEnv]);
      setNewEnvName('');
      setNewEnvUrl('');
      setIsAdding(false);
    }
  };

  const handleSetActive = (id: string) => {
    const updated = environments.map(e => ({
      ...e,
      active: e.id === id
    }));
    onUpdateEnvironments(updated);
  };

  const handleDelete = (id: string) => {
    const filtered = environments.filter(e => e.id !== id);
    // If we deleted the active one, make the first one active (if exists)
    if (environments.find(e => e.id === id)?.active && filtered.length > 0) {
        filtered[0].active = true;
    }
    onUpdateEnvironments(filtered);
  };

  const handleAddVariable = (envId: string) => {
    if (!newVarKey || !newVarValue) return;
    
    const updated = environments.map(e => {
      if (e.id === envId) {
        return {
          ...e,
          variables: [...(e.variables || []), { key: newVarKey, value: newVarValue }]
        };
      }
      return e;
    });
    onUpdateEnvironments(updated);
    setNewVarKey('');
    setNewVarValue('');
    setEditingEnvId(null);
  };

  const handleDeleteVariable = (envId: string, keyToDelete: string) => {
    const updated = environments.map(e => {
      if (e.id === envId) {
        return {
          ...e,
          variables: e.variables.filter(v => v.key !== keyToDelete)
        };
      }
      return e;
    });
    onUpdateEnvironments(updated);
  };

  const handleStartEdit = (envId: string, currentKey: string, currentValue: string) => {
    setEditingVar({ envId, key: currentKey });
    setEditKey(currentKey);
    setEditValue(currentValue);
    setEditingEnvId(null); // Close add form if open
  };

  const handleSaveEdit = () => {
     if (!editingVar) return;
     
     const updated = environments.map(e => {
       if (e.id === editingVar.envId) {
         return {
           ...e,
           variables: e.variables.map(v => 
             v.key === editingVar.key 
               ? { key: editKey, value: editValue }
               : v
           )
         };
       }
       return e;
     });
     onUpdateEnvironments(updated);
     setEditingVar(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Server size={24} className="text-blue-400" />
                Target Environments
            </h2>
            <p className="text-slate-400 text-sm mb-6">
                Configure the environments where Playwright tests will be executed. 
                Select the active environment to target during the next test run.
            </p>

            <div className="space-y-4">
                {environments.map(env => (
                    <div 
                        key={env.id} 
                        className={`rounded-lg border transition-all overflow-hidden ${
                            env.active 
                            ? 'bg-blue-500/5 border-blue-500/50' 
                            : 'bg-slate-900/50 border-slate-700'
                        }`}
                    >
                        {/* Environment Header Row */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                              <div 
                                  onClick={() => handleSetActive(env.id)}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                                      env.active ? 'border-blue-500' : 'border-slate-500'
                                  }`}
                              >
                                  {env.active && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                              </div>
                              <div>
                                  <h4 className={`font-medium ${env.active ? 'text-blue-400' : 'text-slate-200'}`}>
                                      {env.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                                      <Globe size={12} />
                                      {env.url}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              {env.active && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-medium mr-2">
                                      Active
                                  </span>
                              )}
                              <button 
                                  onClick={() => handleDelete(env.id)}
                                  disabled={environments.length <= 1} 
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Delete Environment"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                        </div>

                        {/* Variables Section */}
                        <div className="bg-slate-900/40 px-4 py-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                             <Database size={12} /> Environment Variables
                          </div>
                          
                          {/* List of existing variables */}
                          <div className="space-y-2 mb-3">
                            {env.variables && env.variables.length > 0 ? (
                               env.variables.map((v, idx) => {
                                 const isVisible = visibleValues[`${env.id}-${v.key}`];
                                 return (
                                   <div key={`${env.id}-${idx}`} className="min-h-[32px]">
                                       {editingVar?.envId === env.id && editingVar?.key === v.key ? (
                                           // Edit Mode
                                           <div className="flex items-center gap-2 w-full animate-in fade-in">
                                               <input 
                                                   value={editKey} 
                                                   onChange={e => setEditKey(e.target.value)} 
                                                   className="w-1/3 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                                                   placeholder="KEY"
                                               />
                                               <span className="text-slate-500">=</span>
                                               <input 
                                                   value={editValue} 
                                                   onChange={e => setEditValue(e.target.value)} 
                                                   className="flex-1 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                                                   placeholder="VALUE"
                                               />
                                               <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded">
                                                   <Check size={14}/>
                                               </button>
                                               <button onClick={() => setEditingVar(null)} className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded">
                                                   <X size={14}/>
                                               </button>
                                           </div>
                                       ) : (
                                           // Display Mode
                                           <div className="flex items-center gap-2 text-xs font-mono group w-full py-1">
                                              <span className="text-purple-400 font-medium">{v.key}</span>
                                              <span className="text-slate-600 select-none">=</span>
                                              <span className="text-slate-300 truncate max-w-[250px] font-mono">
                                                {isVisible ? v.value : '•••••••••••••'}
                                              </span>
                                              
                                              <div className="ml-auto flex items-center gap-1">
                                                  <button 
                                                      onClick={() => toggleVisibility(env.id, v.key)}
                                                      className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                      title={isVisible ? "Hide Value" : "Show Value"}
                                                  >
                                                      {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                                                  </button>
                                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-slate-700 pl-1 ml-1">
                                                    <button 
                                                        onClick={() => handleStartEdit(env.id, v.key, v.value)}
                                                        className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                        title="Edit Variable"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteVariable(env.id, v.key)}
                                                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                        title="Delete Variable"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                  </div>
                                              </div>
                                           </div>
                                       )}
                                   </div>
                                 );
                               })
                            ) : (
                               <div className="text-xs text-slate-600 italic">No variables configured</div>
                            )}
                          </div>

                          {/* Add Variable Input */}
                          {editingEnvId === env.id ? (
                             <div className="flex items-center gap-2 animate-in fade-in bg-slate-800/50 p-2 rounded border border-slate-700">
                                <input 
                                  type="text" 
                                  placeholder="KEY" 
                                  className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono focus:border-blue-500 outline-none"
                                  value={newVarKey}
                                  onChange={e => setNewVarKey(e.target.value)}
                                  autoFocus
                                />
                                <span className="text-slate-500">=</span>
                                <input 
                                  type="text" 
                                  placeholder="VALUE" 
                                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono focus:border-blue-500 outline-none"
                                  value={newVarValue}
                                  onChange={e => setNewVarValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddVariable(env.id)}
                                />
                                <button 
                                  onClick={() => handleAddVariable(env.id)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                                >
                                  Add
                                </button>
                                <button 
                                  onClick={() => setEditingEnvId(null)}
                                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                             </div>
                          ) : (
                             <button 
                               onClick={() => {
                                 setEditingEnvId(env.id);
                                 setEditingVar(null); // Cancel any edits
                                 setNewVarKey('');
                                 setNewVarValue('');
                               }}
                               className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors py-1"
                             >
                                <Plus size={12} /> Add Variable
                             </button>
                          )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Environment Form */}
            {isAdding ? (
                <div className="mt-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Add New Environment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={newEnvName}
                                onChange={(e) => setNewEnvName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. Production"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Base URL</label>
                            <input 
                                type="text" 
                                value={newEnvUrl}
                                onChange={(e) => setNewEnvUrl(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAdd}
                            disabled={!newEnvName || !newEnvUrl}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium disabled:opacity-50"
                        >
                            Add Environment
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors px-2 py-1"
                >
                    <Plus size={16} />
                    Add Environment
                </button>
            )}
        </div>

        {/* Global Config */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
             <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <SettingsIcon size={24} className="text-slate-400" />
                Global Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Docker Socket</label>
                    <div className="flex items-center px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-400 font-mono text-sm">
                        unix:///var/run/docker.sock
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ollama URL</label>
                    <div className="flex items-center px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-400 font-mono text-sm">
                        http://localhost:11434
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};
