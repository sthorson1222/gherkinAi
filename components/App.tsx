import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TestGenerator } from './components/TestGenerator';
import { TestRunner } from './components/TestRunner';
import { Settings } from './components/Settings';
import { AppView, GeneratedFeature, TestEnvironment } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Clean State: No features by default
  const [features, setFeatures] = useState<GeneratedFeature[]>([]);
  
  // Clean State: Default Local Environment only
  const [environments, setEnvironments] = useState<TestEnvironment[]>([
    { 
      id: 'env-1', 
      name: 'Local Dev', 
      url: 'http://localhost:3000', 
      active: true,
      variables: [
        { key: 'NODE_ENV', value: 'development' },
      ]
    }
  ]);

  const activeEnvironment = environments.find(e => e.active);

  const handleSaveFeature = (feature: GeneratedFeature) => {
    setFeatures(prev => [feature, ...prev]);
    setCurrentView(AppView.RUNNER);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard features={features} />;
      case AppView.GENERATOR:
        return <TestGenerator onSaveFeature={handleSaveFeature} />;
      case AppView.RUNNER:
        return <TestRunner features={features} activeEnvironment={activeEnvironment} />;
      case AppView.SETTINGS:
        return (
          <Settings 
            environments={environments} 
            onUpdateEnvironments={setEnvironments} 
          />
        );
      default:
        return <Dashboard features={features} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-medium text-white">
            {currentView === AppView.DASHBOARD && 'System Overview'}
            {currentView === AppView.GENERATOR && 'Gherkin AI Generator'}
            {currentView === AppView.RUNNER && 'Playwright Execution'}
            {currentView === AppView.SETTINGS && 'System Settings'}
          </h2>
          <div className="ml-auto flex items-center gap-4">
             {activeEnvironment && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-xs text-slate-300">Target: {activeEnvironment.name}</span>
               </div>
             )}
             <div className="text-xs text-slate-500 font-mono">v1.3.1</div>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
               QA
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}