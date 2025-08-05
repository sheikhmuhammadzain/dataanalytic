import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const ScrapAnalysisChart: React.FC = () => {
  const data = [
    { name: 'Batch 1', ScrapFactor: 5 },
    { name: 'Batch 2', ScrapFactor: 3 },
    { name: 'Batch 3', ScrapFactor: 7 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrap Factor Distribution</CardTitle>
        <CardDescription>Monitor scrap factors across batches</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ScrapFactor" stroke="#E74C3C" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
