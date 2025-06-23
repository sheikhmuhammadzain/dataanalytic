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
      {/* All charts displayed at full width */}
      <div className="w-full">
        <ChartAreaDefault />
      </div>
      
      <div className="w-full">
        <ChartBarLabelCustom />
      </div>
      
      <div className="w-full">
        <ChartLineLabelCustom />
      </div>
      
      {/* Pie and Radial charts in one row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full">
          <ChartPieLabelList />
        </div>
        
        <div className="w-full">
          <ChartRadialLabel />
        </div>
      </div>
      
      <div className="w-full">
        <ChartTooltipAdvanced />
      </div>
    </div>
  );
};
