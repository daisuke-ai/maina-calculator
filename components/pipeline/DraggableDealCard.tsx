'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineDeal, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/pipeline/constants';
import {
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  MapPin,
  GripVertical,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface DraggableDealCardProps {
  deal: PipelineDeal;
  onDealClick: (dealId: string) => void;
  isDragging?: boolean;
  compact?: boolean;
}

export function DraggableDealCard({
  deal,
  onDealClick,
  isDragging = false,
  compact = true
}: DraggableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '$0';
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

  const getDaysUntilClosing = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const daysUntil = getDaysUntilClosing(dateStr);

    if (daysUntil === null) return null;
    if (daysUntil < 0) return { text: `${Math.abs(daysUntil)}d late`, isOverdue: true };
    if (daysUntil === 0) return { text: 'Today', isOverdue: false };
    if (daysUntil <= 7) return { text: `${daysUntil}d`, isOverdue: false };
    if (daysUntil <= 30) return { text: `${daysUntil}d`, isOverdue: false };

    const date = new Date(dateStr);
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isOverdue: false
    };
  };

  const priorityColor = PRIORITY_COLORS[deal.priority as keyof typeof PRIORITY_COLORS] || '#6B7280';
  const closingDate = formatDate(deal.expected_closing_date);
  const daysUntilClosing = getDaysUntilClosing(deal.expected_closing_date);

  // Determine urgency based on days until closing
  const isUrgent = daysUntilClosing !== null && daysUntilClosing <= 7 && daysUntilClosing >= 0;
  const isOverdue = daysUntilClosing !== null && daysUntilClosing < 0;

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`
          group relative bg-card border rounded-lg shadow-sm
          hover:shadow-md hover:border-accent transition-all duration-200
          ${isSortableDragging || isDragging ? 'opacity-50 shadow-lg rotate-1 scale-105' : ''}
          cursor-pointer
        `}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-muted"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        <div onClick={() => onDealClick(deal.id)} className="p-3 space-y-2">
          {/* Property Address */}
          <div className="pr-6">
            <h4 className="font-semibold text-xs text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {deal.property_address}
            </h4>
          </div>

          {/* Value and Probability */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(deal.opportunity_value)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {deal.probability_to_close}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${deal.probability_to_close}%`,
                backgroundColor: priorityColor
              }}
            />
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-1">
            {/* Priority Indicator */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: priorityColor }}
              title={PRIORITY_LABELS[deal.priority]}
            />

            {/* Closing Date with Alert */}
            {closingDate && (
              <div className={`flex items-center gap-1 text-xs ${
                isOverdue ? 'text-destructive' :
                isUrgent ? 'text-warning' :
                'text-muted-foreground'
              }`}>
                {isOverdue ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span className="font-medium">{closingDate.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed View (non-compact)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        group relative bg-card border rounded-lg shadow-sm
        hover:shadow-md hover:border-accent transition-all duration-200
        ${isSortableDragging || isDragging ? 'opacity-50 shadow-lg rotate-1 scale-105' : ''}
        cursor-pointer
      `}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-muted"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div onClick={() => onDealClick(deal.id)} className="p-4 space-y-3">
        {/* Header with Priority Badge */}
        <div className="pr-8">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <h4 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {deal.property_address}
            </h4>
          </div>
        </div>

        {/* Value Section */}
        <div className="flex items-center justify-between bg-muted/50 rounded-md p-2.5">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Value</span>
          </div>
          <span className="text-base font-bold text-foreground">
            {formatCurrency(deal.opportunity_value)}
          </span>
        </div>

        {/* Probability Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Probability</span>
            <span className="text-xs font-medium">{deal.probability_to_close}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${deal.probability_to_close}%`,
                backgroundColor: priorityColor
              }}
            />
          </div>
        </div>

        {/* Agent Info */}
        <div className="flex items-center gap-2 text-xs">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{deal.agent_name}</span>
        </div>

        {/* Footer with Priority and Date */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{
              backgroundColor: `${priorityColor}20`,
              color: priorityColor
            }}
          >
            {PRIORITY_LABELS[deal.priority]}
          </span>

          {closingDate && (
            <div className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-destructive' :
              isUrgent ? 'text-warning' :
              'text-muted-foreground'
            }`}>
              <Calendar className="w-3 h-3" />
              <span className="font-medium">{closingDate.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}