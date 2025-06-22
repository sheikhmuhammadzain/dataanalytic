import React from 'react';
import { ChartAreaDefault } from './charts/ChartAreaDefault';
import { ChartBarLabelCustom } from './charts/ChartBarLabelCustom';
import { ChartLineLabelCustom } from './charts/ChartLineLabelCustom';
import { ChartPieLabelList } from './charts/ChartPieLabelList';
import { ChartRadialLabel } from './charts/ChartRadialLabel';
import { ChartTooltipAdvanced } from './charts/ChartTooltipAdvanced';
import { ChartBoxPlot } from './charts/ChartBoxPlot';
import { ChartScatterPlot } from './charts/ChartScatterPlot';

interface DefaultVisualizationsProps {
  showFilters: boolean;
}

export const DefaultVisualizations: React.FC<DefaultVisualizationsProps> = ({ showFilters }) => {
  return (
    <div className="space-y-6">
      {/* All charts displayed at full width */}
      <div className="w-full">
        <ChartBoxPlot />
      </div>
      
      <div className="w-full">
        <ChartScatterPlot />
      </div>
      
      <div className="w-full">
        <ChartAreaDefault />
      </div>
      
      <div className="w-full">
        <ChartBarLabelCustom />
      </div>
      
      <div className="w-full">
        <ChartLineLabelCustom />
      </div>
      
      <div className="w-full">
        <ChartPieLabelList />
      </div>
      
      <div className="w-full">
        <ChartRadialLabel />
      </div>
      
      <div className="w-full">
        <ChartTooltipAdvanced />
      </div>
    </div>
  );
};
