'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { PipelineDeal, STAGE_LABELS, STAGE_COLORS } from '@/lib/pipeline/constants';
import { DraggableDealCard } from './DraggableDealCard';
import { Plus, TrendingUp } from 'lucide-react';

interface DroppableStageColumnProps {
  stage: string;
  deals: PipelineDeal[];
  onDealClick: (dealId: string) => void;
  onRefresh: () => void;
}

export function DroppableStageColumn({ stage, deals, onDealClick, onRefresh }: DroppableStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.opportunity_value || 0), 0);
  const avgProbability = deals.length > 0
    ? Math.round(deals.reduce((sum, deal) => sum + deal.probability_to_close, 0) / deals.length)
    : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageColorMap: Record<string, string> = {
    loi_accepted: 'from-green-500/20 to-green-500/5 border-green-500/30',
    due_diligence: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    contract: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    closing: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  };

  const stageIconColor: Record<string, string> = {
    loi_accepted: 'text-green-500',
    due_diligence: 'text-blue-500',
    contract: 'text-orange-500',
    closing: 'text-purple-500',
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <Card
        className={`
          bg-gradient-to-b ${stageColorMap[stage] || 'from-card to-card/50'}
          border-2 shadow-xl flex flex-col flex-1
          transition-all duration-200
          ${isOver ? 'ring-4 ring-accent ring-opacity-50 scale-[1.02] shadow-2xl' : ''}
        `}
      >
        {/* Column Header */}
        <div className="p-4 pb-3 border-b-2 border-border bg-card/50 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-extrabold ${stageIconColor[stage]} flex items-center gap-2`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
            </h3>
            <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {deals.length}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-bold text-foreground">{formatCurrency(totalValue)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Avg Probability
              </span>
              <span className="font-bold text-accent">{avgProbability}%</span>
            </div>
          </div>
        </div>

        {/* Deal Cards */}
        <div
          ref={setNodeRef}
          className={`
            flex-1 p-3 space-y-3 overflow-y-auto
            ${isOver ? 'bg-accent/5' : ''}
            transition-colors
          `}
        >
          <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-3">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {isOver ? 'Drop here' : 'No deals'}
                </p>
              </div>
            ) : (
              deals.map(deal => (
                <DraggableDealCard
                  key={deal.id}
                  deal={deal}
                  onDealClick={onDealClick}
                />
              ))
            )}
          </SortableContext>
        </div>

        {/* Drop Indicator */}
        {isOver && (
          <div className="absolute inset-0 border-4 border-accent rounded-xl pointer-events-none animate-pulse" />
        )}
      </Card>
    </div>
  );
}
