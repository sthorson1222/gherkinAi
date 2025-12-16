
import React from 'react';
import { DockerStatus } from './DockerStatus.tsx';
import { GeneratedFeature } from '../types.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FileCode, Activity, CheckCircle, XCircle, Image as ImageIcon, ExternalLink, X, Download, BarChart2 } from 'lucide-react';

interface DashboardProps {
  features: GeneratedFeature[];
}

// Custom Tooltip to avoid defaultProps issues and improve styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-200 font-medium text-sm">{label || payload[0].name}</p>
        <p className="text-blue-400 text-sm">
          {payload[0].value} units
        </p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ features = [] }) => {
  // Mock Stats Calculation
  const featureCount = features.length;
  const passedCount = Math.floor(featureCount * 0.8); // Mock pass rate
  
  const stats = [
    { label: 'Total Features', value: featureCount, icon: FileCode, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Scenarios', value: featureCount * 3 + 2, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Pass Rate', value: featureCount > 0 ? '92%' : '0%', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Avg Execution', value: '3.8s', icon: BarChart2, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  const chartData = [
    { name: 'Auth', value: 12 },
    { name: 'Checkout', value: 8 },
    { name: 'Search', value: 15 },
    { name: 'Admin', value: 6 },
    { name: 'API', value: 10 },
  ];

  const pieData = [
    { name: 'Covered', value: 75 },
    { name: 'Pending', value: 25 },
  ];

  const COLORS = ['#34D399', '#334155'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm transition-transform hover:scale-[1.01]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-white mt-2">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
             <h3 className="text-lg font-semibold text-white mb-6">Test Suite Distribution</h3>
             <div className="w-full h-72 min-h-[288px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                   <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#94a3b8' }}
                      dy={10}
                   />
                   <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#94a3b8' }}
                   />
                   <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                   <Bar dataKey="value" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1">
             <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-semibold text-white">Recent Library Updates</h3>
             </div>
             <div className="divide-y divide-slate-700 max-h-[300px] overflow-y-auto">
               {features.length > 0 ? (
                 features.map((feature) => (
                   <div key={feature.id} className="p-4 hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-slate-700 rounded text-blue-400">
                            <FileCode size={20} />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-slate-200 font-medium truncate">{feature.title}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-1">ID: {feature.id}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-slate-500">{new Date(feature.createdAt).toLocaleDateString()}</span>
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">Generated</span>
                      </div>
                   </div>
                 ))
               ) : (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                    <FileCode size={32} className="opacity-20" />
                    <p>No features generated yet.</p>
                    <p className="text-xs">Go to Generator to create your first test.</p>
                  </div>
               )}
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 flex flex-col">
           <DockerStatus />
           
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex-1">
              <h3 className="text-lg font-semibold text-white mb-4">Coverage Analysis</h3>
              <div className="h-56 relative min-h-[224px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-4xl font-bold text-white tracking-tight">75%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Covered</span>
                 </div>
              </div>
              <div className="mt-6 space-y-4">
                 <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Critical Path</span>
                        <span className="text-green-400 font-medium">92%</span>
                     </div>
                     <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[92%] rounded-full"></div>
                     </div>
                 </div>
                 <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Edge Cases</span>
                        <span className="text-blue-400 font-medium">64%</span>
                     </div>
                     <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[64%] rounded-full"></div>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
