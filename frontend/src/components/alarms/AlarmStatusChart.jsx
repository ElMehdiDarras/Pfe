// src/components/alarms/AlarmStatusChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const AlarmStatusChart = ({ data, height = 300 }) => {
  // Safety check for data
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        border: '1px dashed #ccc',
        borderRadius: '4px',
        color: '#666'
      }}>
        Aucune donnée disponible pour le graphique
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="hour" 
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={{ stroke: '#e0e0e0' }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={{ stroke: '#e0e0e0' }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            borderRadius: '4px'
          }}
        />
        <Legend 
          verticalAlign="bottom"
          height={36}
        />
        <Line 
          type="monotone" 
          dataKey="critical" 
          stroke="#f44336" 
          strokeWidth={2} 
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
          name="Critique"
        />
        <Line 
          type="monotone" 
          dataKey="major" 
          stroke="#ff9800" 
          strokeWidth={2} 
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
          name="Majeure"
        />
        <Line 
          type="monotone" 
          dataKey="warning" 
          stroke="#ffeb3b" 
          strokeWidth={2} 
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
          name="Warning"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AlarmStatusChart;