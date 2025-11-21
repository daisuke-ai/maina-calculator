'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import {
  PipelineDeal,
  PipelineType,
  STAGE_LABELS,
  STAGE_SHORT_LABELS,
  STAGE_COLORS,
  STAGE_DESCRIPTIONS,
  getStageProbability,
} from '@/lib/pipeline/constants';
import { DraggableDealCard } from './DraggableDealCard';
import { Plus, Info, DollarSign, TrendingUp } from 'lucide-react';

interface DroppableStageColumnProps {
  stage: string;
  pipelineType: PipelineType;
  deals: PipelineDeal[];
  onDealClick: (dealId: string) => void;
  onRefresh: () => void;
  compact?: boolean;
}

export function DroppableStageColumn({
  stage,
  pipelineType,
  deals,
  onDealClick,
  onRefresh,
  compact = true
}: DroppableStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.opportunity_value || 0), 0);
  const stageProbabilities = getStageProbability(pipelineType);
  const probability = stageProbabilities[stage] || 0;
  const weightedValue = (totalValue * probability) / 100;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#6B7280';
  const stageDescription = STAGE_DESCRIPTIONS[stage as keyof typeof STAGE_DESCRIPTIONS] || '';
  const stageLabel = compact
    ? STAGE_SHORT_LABELS[stage as keyof typeof STAGE_SHORT_LABELS]
    : STAGE_LABELS[stage as keyof typeof STAGE_LABELS];

  return (
    <div className="flex flex-col h-full">
      <div
        className={`
          bg-card border rounded-lg flex flex-col flex-1 min-h-[500px]
          transition-all duration-200
          ${isOver ? 'border-accent shadow-lg scale-[1.01]' : 'border-border'}
        `}
      >
        {/* Column Header - Clean and Compact */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stageColor }}
              />
              <h3 className="font-semibold text-sm text-foreground">
                {stageLabel}
              </h3>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {deals.length}
            </span>
          </div>

          {/* Stage Info Tooltip */}
          {compact && stageDescription && (
            <div className="group relative">
              <p className="text-xs text-muted-foreground truncate cursor-help">
                {stageDescription}
              </p>
              <div className="absolute z-10 hidden group-hover:block bottom-full left-0 right-0 mb-1 p-2 bg-popover border rounded-md shadow-lg">
                <p className="text-xs text-popover-foreground">
                  {stageDescription}
                </p>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs">
              <span className="text-muted-foreground block">Value</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground block">Weighted</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(weightedValue)}
              </span>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Probability</span>
              <span className="font-medium">{probability}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${probability}%`,
                  backgroundColor: stageColor
                }}
              />
            </div>
          </div>
        </div>

        {/* Deal Cards Container */}
        <div
          ref={setNodeRef}
          className={`
            flex-1 p-2 space-y-2 overflow-y-auto
            ${isOver ? 'bg-accent/5' : ''}
            transition-colors scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent
          `}
        >
          <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
            {deals.length === 0 ? (
              <div className="text-center py-8">
                <div className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-lg
                  ${isOver ? 'bg-accent/20' : 'bg-muted/50'}
                  transition-colors mb-2
                `}>
                  <Plus className={`w-5 h-5 ${isOver ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOver ? 'Drop deal here' : 'No deals'}
                </p>
              </div>
            ) : (
              deals.map(deal => (
                <DraggableDealCard
                  key={deal.id}
                  deal={deal}
                  onDealClick={onDealClick}
                  compact={compact}
                />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}