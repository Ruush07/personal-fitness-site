"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// This is dummy data. Later, we will fetch this straight from your Supabase database!
const data = [
  { date: 'Mon', weight: 75.5 },
  { date: 'Tue', weight: 75.2 },
  { date: 'Wed', weight: 74.8 },
  { date: 'Thu', weight: 75.0 },
  { date: 'Fri', weight: 74.6 },
  { date: 'Sat', weight: 74.3 },
  { date: 'Sun', weight: 74.0 },
];

export default function WeightChart() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm h-[400px] w-full mt-6 md:mt-0">
      <h2 className="text-xl font-semibold mb-6">Weight Fluctuation (7 Days)</h2>
      
      <div className="h-full w-full pb-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#a3a3a3" 
              tick={{fill: '#a3a3a3'}}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']} 
              stroke="#a3a3a3" 
              tick={{fill: '#a3a3a3'}}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}