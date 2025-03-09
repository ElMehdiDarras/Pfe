// src/components/alarms/AlarmStatusChart.jsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AlarmStatusChart = ({ data, height = 400 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="hour" 
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#e0e0e0' }}
          tickLine={{ stroke: '#e0e0e0' }}
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
            borderRadius: '4px',
            fontSize: '12px'
          }} 
        />
        <Legend 
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => {
            let color;
            switch(value) {
              case 'critical':
                value = 'Critique';
                color = '#f44336';
                break;
              case 'major':
                value = 'Majeure';
                color = '#ff9800';
                break;
              case 'warning':
                value = 'Warning';
                color = '#ffeb3b';
                break;
            }
            return <span style={{ color }}>{value}</span>;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="critical" 
          stroke="#f44336" 
          strokeWidth={2} 
          dot={{ r: 3, fill: '#f44336' }} 
          activeDot={{ r: 5 }}
        />
        <Line 
          type="monotone" 
          dataKey="major" 
          stroke="#ff9800" 
          strokeWidth={2} 
          dot={{ r: 3, fill: '#ff9800' }} 
          activeDot={{ r: 5 }}
        />
        <Line 
          type="monotone" 
          dataKey="warning" 
          stroke="#ffeb3b" 
          strokeWidth={2} 
          dot={{ r: 3, fill: '#ffeb3b' }} 
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AlarmStatusChart;