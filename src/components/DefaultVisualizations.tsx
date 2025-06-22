import React from 'react';
import { ChartAreaDefault } from './charts/ChartAreaDefault';
import { ChartBarLabelCustom } from './charts/ChartBarLabelCustom';
import { ChartLineLabelCustom } from './charts/ChartLineLabelCustom';
import { ChartPieLabelList } from './charts/ChartPieLabelList';
import { ChartRadialLabel } from './charts/ChartRadialLabel';
import { ChartTooltipAdvanced } from './charts/ChartTooltipAdvanced';

interface DefaultVisualizationsProps {
  showFilters: boolean;
}

export const DefaultVisualizations: React.FC<DefaultVisualizationsProps> = ({ showFilters }) => {
  return (
    <div className="space-y-6">
      {/* Responsive grid of modular charts - 3 per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartAreaDefault />
        <ChartBarLabelCustom />
        <ChartLineLabelCustom />
        <ChartPieLabelList />
        <ChartRadialLabel />
        <ChartTooltipAdvanced />
        {/* Additional charts can be added here in a modular way */}
      </div>
    </div>
  );
};
