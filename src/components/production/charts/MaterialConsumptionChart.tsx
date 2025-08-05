import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export const MaterialConsumptionChart: React.FC = () => {
  const data = [
    { name: 'Batch 1', IngredientA: 30, IngredientB: 20, IngredientC: 15 },
    { name: 'Batch 2', IngredientA: 50, IngredientB: 30, IngredientC: 20 },
    { name: 'Batch 3', IngredientA: 40, IngredientB: 50, IngredientC: 25 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Consumption per Batch</CardTitle>
        <CardDescription>Ingredient consumption across different batches</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value.toLocaleString()} KG`, '']} />
            <Legend />
            <Bar dataKey="IngredientA" stackId="a" fill="#E74C3C" />
            <Bar dataKey="IngredientB" stackId="a" fill="#8E44AD" />
            <Bar dataKey="IngredientC" stackId="a" fill="#3498DB" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
