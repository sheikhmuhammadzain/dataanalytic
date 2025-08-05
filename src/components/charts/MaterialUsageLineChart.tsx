import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../../store/dataStore';
import { formatJulianDate } from '../../lib/manufacturingUtils';

export const MaterialUsageLineChart: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  if (!processedData?.rows) return null;

  // Prepare data for line chart
  const data = processedData.rows.map(row => ({
    date: formatJulianDate(row.WIP_ACT_START_DATE as number),
    quantity: row.WIP_QTY,
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="quantity" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
