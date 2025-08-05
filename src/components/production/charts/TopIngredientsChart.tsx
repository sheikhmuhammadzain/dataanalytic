import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const TopIngredientsChart: React.FC = () => {
  const data = [
    { name: 'Ingredient A', value: 300 },
    { name: 'Ingredient B', value: 500 },
    { name: 'Ingredient C', value: 200 },
  ];

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Ingredients by Total Consumption</CardTitle>
        <CardDescription>Identify major ingredients in use</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value.toLocaleString()} KG`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
