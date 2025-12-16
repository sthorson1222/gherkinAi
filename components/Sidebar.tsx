import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileCode, PlayCircle, Settings, Box } from 'lucide-react';
import { AppView } from '../types.ts';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  backendUrl: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, backendUrl }) => {
  const [dockerStatus, setDockerStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.GENERATOR, label: 'Test Generator', icon: FileCode },
    { id: AppView.RUNNER, label: 'Test Runner', icon: PlayCircle },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${backendUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          // Check specifically for 'inside-container' mode as requested
          if (data.status === 'ok' && data.mode === 'inside-container') {
            setDockerStatus('connected');
          } else {
            setDockerStatus('disconnected');
          }
        } else {
          setDockerStatus('disconnected');
        }
      } catch (error) {
        setDockerStatus('disconnected');
      }
    };

    // Check immediately and poll every 5 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Box className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight">GherkinGenius</h1>
          <p className="text-xs text-slate-400">Control Plane</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Online</span>
          </div>

          <div className="flex items-center justify-between">
             <span>Gemini AI:</span>
             <span className="text-slate-300">Ready</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-2">
             <span>Docker Agent:</span>
             <div className="flex items-center gap-2">
                <span className={dockerStatus === 'connected' ? "text-green-400 font-medium" : "text-slate-500"}>
                  {dockerStatus === 'connected' ? 'Connected' : 'Offline'}
                </span>
                <div className={`w-2 h-2 rounded-full ${dockerStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};