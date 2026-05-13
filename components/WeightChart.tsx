"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";

export default function WeightChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeightData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch the user's weight history, ordered by oldest to newest
      const { data: logs, error } = await supabase
        .from('weight_logs')
        .select('weight, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (logs && logs.length > 0) {
        // Format the dates to look pretty on the chart (e.g., "Oct 12")
        const formattedData = logs.map(log => ({
          date: new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: log.weight
        }));
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchWeightData();
  }, []);

  // 1. THE LOADING STATE
  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-72 flex items-center justify-center">
        <Activity className="text-blue-500 animate-pulse" size="{32}"/>
      </div>
    );
  }

  // 2. THE EMPTY STATE (This is what you will see right now!)
  if (data.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-72 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-neutral-800 rounded-full mb-4">
          <Activity className="text-neutral-500" size="{32}"/>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No Weight Data Yet</h3>
        <p className="text-neutral-400 text-sm max-w-xs">
          Your weight progress graph will appear here once you start logging your stats!
        </p>
      </div>
    );
  }

  // 3. THE ACTIVE CHART (This will appear once you log data)
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-72">
      <h3 className="text-lg font-bold text-white mb-6">Weight Progress</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data="{data}">
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical="{false}"/>
            <XAxis dataKey="date" stroke="#737373" fontSize="{12}" tickLine="{false}" axisLine="{false}"/>
            <YAxis domain="{['dataMin" - 2', 'dataMax + 2']} stroke="#737373" fontSize="{12}" tickLine="{false}" axisLine="{false}" tickFormatter="{(value)"> `${value}kg`}
            />
            <Tooltip contentStyle="{{" backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', color: '#fff' }} itemStyle="{{" '#3b82f6'/>
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth="{3}" dot="{{" fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot="{{" 6, '#60a5fa'/>
          </YAxis></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}