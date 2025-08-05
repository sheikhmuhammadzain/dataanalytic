import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const BatchProductionChart: React.FC = () => {
  const data = [
    { name: 'Batch 1', Planned: 120, Produced: 100 },
    { name: 'Batch 2', Planned: 150, Produced: 130 },
    { name: 'Batch 3', Planned: 180, Produced: 120 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Production Quantity vs Plan</CardTitle>
        <CardDescription>Planned vs actual production quantities by batch</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value.toLocaleString()} KG`, '']} />
            <Legend />
            <Bar dataKey="Planned" fill="#4A90E2" />
            <Bar dataKey="Produced" fill="#50E3C2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
