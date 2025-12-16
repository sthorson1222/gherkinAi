
import React from 'react';
import { ContainerStatus } from '../types.ts';
import { Cpu, HardDrive, RefreshCw, Terminal } from 'lucide-react';

export const DockerStatus: React.FC = () => {
  // Mock data representing the containers managed by docker-compose
  const containers: ContainerStatus[] = [
    { id: 'c1', name: 'playwright-runner', image: 'mcr.microsoft.com/playwright:v1.40.0', status: 'running', uptime: '4h 23m', cpu: 1.2, memory: 450 },
    { id: 'c2', name: 'ollama-service', image: 'ollama/ollama:latest', status: 'running', uptime: '4h 23m', cpu: 0.5, memory: 1024 },
    { id: 'c3', name: 'app-frontend', image: 'node:18-alpine', status: 'running', uptime: '4h 24m', cpu: 0.8, memory: 120 },
    { id: 'c4', name: 'app-backend', image: 'python:3.11-slim', status: 'running', uptime: '4h 24m', cpu: 1.1, memory: 200 },
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Terminal size={18} className="text-blue-400" />
          Container Status
        </h3>
        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">
          docker-compose active
        </span>
      </div>
      <div className="p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
            <tr>
              <th className="px-6 py-3">Container Name</th>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">CPU / MEM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {containers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${c.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {c.name}
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{c.image}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 capitalize">{c.status}</span>
                    <span className="text-slate-500 text-xs">({c.uptime})</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Cpu size={12} /> {c.cpu}%
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <HardDrive size={12} /> {c.memory}MB
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
