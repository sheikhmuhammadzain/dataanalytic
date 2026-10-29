import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const CostAnalysisChart: React.FC = () => {
  const data = [
    { name: 'Batch 1', MaterialCost: 1200, PlannedCost: 1000 },
    { name: 'Batch 2', MaterialCost: 1500, PlannedCost: 1400 },
    { name: 'Batch 3', MaterialCost: 1800, PlannedCost: 1600 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Material Cost per Batch</CardTitle>
        <CardDescription>See how material costs align with the planned budget</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `PKR ${value.toLocaleString()}`} />
            <Tooltip formatter={(value) => [`PKR ${value.toLocaleString()}`, '']} />
            <Legend />
            <Line type="monotone" dataKey="MaterialCost" stroke="#27AE60" />
            <Line type="monotone" dataKey="PlannedCost" stroke="#F39C12" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
