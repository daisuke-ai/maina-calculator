'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Filter,
  Search,
  ChevronRight,
  Activity,
  Target,
  Info,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PipelineDeal, STAGE_LABELS, STAGE_SHORT_LABELS, STAGE_DESCRIPTIONS, STAGE_COLORS, PIPELINE_STAGES, STAGE_PROBABILITY } from '@/lib/pipeline/constants';
import NewDealModal from '@/components/pipeline/NewDealModal';
import DealDetailModal from '@/components/pipeline/DealDetailModal';
import { DraggableDealCard } from '@/components/pipeline/DraggableDealCard';
import { DroppableStageColumn } from '@/components/pipeline/DroppableStageColumn';

export default function PipelinePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<PipelineDeal | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch deals and summary
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active deals
      const dealsRes = await fetch('/api/crm/pipeline/deals?status=active');
      const dealsData = await dealsRes.json();
      setDeals(dealsData.deals || []);

      // Fetch summary
      const summaryRes = await fetch('/api/crm/pipeline/analytics/summary?days_back=30');
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    const matchesPriority = filterPriority === 'all' || deal.priority === filterPriority;
    const matchesSearch = !searchQuery ||
      deal.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.agent_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  // Group deals by stage - Updated for new pipeline stages
  const dealsByStage = {
    loi_accepted: filteredDeals.filter(d => d.stage === 'loi_accepted'),
    emd: filteredDeals.filter(d => d.stage === 'emd'),
    psa: filteredDeals.filter(d => d.stage === 'psa'),
    inspection: filteredDeals.filter(d => d.stage === 'inspection'),
    title_escrow: filteredDeals.filter(d => d.stage === 'title_escrow'),
    closing: filteredDeals.filter(d => d.stage === 'closing'),
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    setActiveDragDeal(deal || null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;

    // Find the deal being moved
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistically update UI
    setDeals(prevDeals =>
      prevDeals.map(d =>
        d.id === dealId ? { ...d, stage: newStage as any } : d
      )
    );

    // Update on server
    try {
      const response = await fetch(`/api/crm/pipeline/deals/${dealId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stage: newStage, changed_by: 'drag_drop' }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to move deal');
      }

      // Refresh to get accurate data
      await fetchData();
    } catch (error: any) {
      console.error('Error moving deal:', error);
      alert(`Failed to move deal: ${error.message}`);
      // Revert on error
      await fetchData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateStageValue = (stageDeals: PipelineDeal[]) => {
    return stageDeals.reduce((sum, deal) => sum + (deal.opportunity_value || 0), 0);
  };

  const calculateWeightedValue = (stageDeals: PipelineDeal[], stageName: string) => {
    const probability = STAGE_PROBABILITY[stageName as keyof typeof STAGE_PROBABILITY] || 0;
    const totalValue = calculateStageValue(stageDeals);
    return (totalValue * probability) / 100;
  };

  if (loading && deals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="min-h-screen bg-background">
        {/* Professional Header */}
        <div className="border-b">
          <div className="container mx-auto max-w-[1800px] px-4 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <Link href="/crm" className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Deal Pipeline</h1>
                  <p className="text-muted-foreground mt-1">Track deals from LOI to closing</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  {viewMode === 'compact' ? 'Detailed' : 'Compact'} View
                </button>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowNewDealModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Deal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-[1800px] px-4 py-6 space-y-6">
          {/* Key Metrics - Clean Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 border-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Deals</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {summary.allTime?.total_active_deals || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatCurrency(summary.allTime?.active_pipeline_value || 0)} total
                    </p>
                  </div>
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6 border-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Weighted Pipeline</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(summary.allTime?.weighted_pipeline_value || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on probability
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6 border-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Won This Month</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {summary.timeRange?.total_won || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatCurrency(summary.timeRange?.won_value || 0)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              </Card>

              <Card className="p-6 border-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {summary.allTime?.overall_conversion_rate || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Avg: {summary.allTime?.avg_days_to_close || 0} days
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties or agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Pipeline Stages - Modern Kanban Board */}
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-6 gap-4 min-w-[1200px]">
              {/* LOI Accepted */}
              <DroppableStageColumn
                stage="loi_accepted"
                deals={dealsByStage.loi_accepted}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />

              {/* EMD */}
              <DroppableStageColumn
                stage="emd"
                deals={dealsByStage.emd}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />

              {/* PSA */}
              <DroppableStageColumn
                stage="psa"
                deals={dealsByStage.psa}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />

              {/* Inspection */}
              <DroppableStageColumn
                stage="inspection"
                deals={dealsByStage.inspection}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />

              {/* Title & Escrow */}
              <DroppableStageColumn
                stage="title_escrow"
                deals={dealsByStage.title_escrow}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />

              {/* Closing */}
              <DroppableStageColumn
                stage="closing"
                deals={dealsByStage.closing}
                onDealClick={setSelectedDealId}
                onRefresh={fetchData}
                compact={viewMode === 'compact'}
              />
            </div>
          </div>

          {/* Pipeline Flow Indicator */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                <span>LOI</span>
              </div>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <span>EMD</span>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <span>PSA</span>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <span>Inspection</span>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <span>Title & Escrow</span>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <span>Closing</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border mx-2"></div>
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredDeals.length === 0 && !loading && (
            <div className="text-center py-16">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No deals found</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {searchQuery || filterPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by creating your first deal'}
              </p>
              {!searchQuery && filterPriority === 'all' && (
                <button
                  onClick={() => setShowNewDealModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Deal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragDeal ? (
            <div className="opacity-90">
              <DraggableDealCard
                deal={activeDragDeal}
                onDealClick={() => {}}
                isDragging={true}
                compact={viewMode === 'compact'}
              />
            </div>
          ) : null}
        </DragOverlay>
      </main>

      {/* New Deal Modal */}
      {showNewDealModal && (
        <NewDealModal
          onClose={() => setShowNewDealModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Deal Detail Modal */}
      {selectedDealId && (
        <DealDetailModal
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          onUpdate={fetchData}
        />
      )}
    </DndContext>
  );
}