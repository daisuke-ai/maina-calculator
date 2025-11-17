'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineDeal, PRIORITY_LABELS } from '@/lib/pipeline/constants';
import {
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  GripVertical,
} from 'lucide-react';

interface DraggableDealCardProps {
  deal: PipelineDeal;
  onDealClick: (dealId: string) => void;
  isDragging?: boolean;
}

export function DraggableDealCard({ deal, onDealClick, isDragging = false }: DraggableDealCardProps) {
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Today', isOverdue: false };
    if (diffDays <= 7) return { text: `${diffDays}d`, isOverdue: false };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false };
  };

  const priorityColors = {
    urgent: 'bg-red-500/20 text-red-500 border-red-500/50',
    high: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
    medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    low: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
  };

  const closingDate = formatDate(deal.expected_closing_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        group relative bg-card border-2 border-border rounded-xl shadow-lg
        hover:shadow-2xl hover:border-accent transition-all duration-200
        ${isSortableDragging || isDragging ? 'opacity-50 shadow-2xl border-accent rotate-2 scale-105' : ''}
        cursor-pointer
      `}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-accent/20"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div onClick={() => onDealClick(deal.id)} className="p-4 space-y-3">
        {/* Header: Property Address */}
        <div className="pr-8">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <h4 className="font-bold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors">
              {deal.property_address}
            </h4>
          </div>
        </div>

        {/* Opportunity Value */}
        <div className="flex items-center justify-between bg-accent/5 rounded-lg p-3 border border-accent/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            <span className="text-xs text-muted-foreground font-medium">Value</span>
          </div>
          <span className="text-xl font-extrabold text-accent">
            {formatCurrency(deal.opportunity_value)}
          </span>
        </div>

        {/* Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Close Probability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${deal.probability_to_close}%` }}
              />
            </div>
            <span className="text-sm font-bold text-accent">{deal.probability_to_close}%</span>
          </div>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-2 text-xs">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{deal.agent_name}</span>
        </div>

        {/* Priority & Closing Date */}
        <div className="flex items-center gap-2 justify-between pt-2 border-t border-border">
          <span className={`text-xs px-2 py-1 rounded-md font-semibold border ${priorityColors[deal.priority]}`}>
            {PRIORITY_LABELS[deal.priority]}
          </span>

          {closingDate && (
            <div className={`flex items-center gap-1 text-xs ${closingDate.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{closingDate.text}</span>
            </div>
          )}
        </div>

        {/* Contact Info (on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-border space-y-1.5">
          {deal.realtor_email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{deal.realtor_email}</span>
            </div>
          )}
          {deal.realtor_phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{deal.realtor_phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-accent/0 group-hover:bg-accent/5 transition-colors pointer-events-none" />
    </div>
  );
}
