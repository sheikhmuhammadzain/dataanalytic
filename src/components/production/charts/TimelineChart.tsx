import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const TimelineChart: React.FC = () => {
  const data = [
    { name: 'Batch 1', ProcessingTime: 10 },
    { name: 'Batch 2', ProcessingTime: 8 },
    { name: 'Batch 3', ProcessingTime: 9 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Processing Time Trend</CardTitle>
        <CardDescription>Track processing time across batches</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} Days`, '']} />
            <Legend />
            <Bar dataKey="ProcessingTime" fill="#3498DB" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
