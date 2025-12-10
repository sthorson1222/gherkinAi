
import React from 'react';
import { DockerStatus } from './DockerStatus';
import { GeneratedFeature, TestRun } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { FileCode, Activity, CheckCircle, XCircle } from 'lucide-react';

interface DashboardProps {
  features: GeneratedFeature[];
}

export const Dashboard: React.FC<DashboardProps> = ({ features }) => {
  // Stats derived from props (features) or clean defaults for Day 0
  const runStats = [
    { name: 'Passed', value: 0, color: '#22c55e' },
    { name: 'Failed', value: 0, color: '#ef4444' },
    { name: 'Skipped', value: 0, color: '#94a3b8' },
  ];

  const activityData = [
    { name: 'Mon', tests: 0 },
    { name: 'Tue', tests: 0 },
    { name: 'Wed', tests: 0 },
    { name: 'Thu', tests: 0 },
    { name: 'Fri', tests: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Features</p>
              <h3 className="text-2xl font-bold text-white mt-1">{features.length}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FileCode size={20} />
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Test Run Rate</p>
              <h3 className="text-2xl font-bold text-white mt-1">N/A</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
              <Activity size={20} />
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Last Run</p>
              <h3 className="text-xl font-bold text-white mt-1">None</h3>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Flaky Tests</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
              <XCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Docker Status */}
        <div className="lg:col-span-2">
          <DockerStatus />
        </div>

        {/* Stats Chart */}
        <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-6">Test Success Ratio</h3>
          <div className="h-48 w-full flex items-center justify-center">
            {features.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={runStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {runStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-slate-500 text-sm italic">No data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-slate-400">
            {runStats.map(stat => (
              <div key={stat.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                {stat.name} ({stat.value})
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Activity Bar Chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-6">Weekly Execution Activity</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={activityData}>
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                   cursor={{ fill: '#334155', opacity: 0.2 }}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                 />
                 <Bar dataKey="tests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
