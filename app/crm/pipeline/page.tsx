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
  LayoutDashboard,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Percent,
  BarChart3,
  ExternalLink,
  Filter,
  Settings,
  Download,
  Eye,
  Target,
  Clock,
} from 'lucide-react';
import { PipelineDeal, STAGE_LABELS, PIPELINE_STAGES } from '@/lib/pipeline/constants';
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

  // Group deals by stage
  const dealsByStage = {
    loi_accepted: filteredDeals.filter(d => d.stage === 'loi_accepted'),
    due_diligence: filteredDeals.filter(d => d.stage === 'due_diligence'),
    contract: filteredDeals.filter(d => d.stage === 'contract'),
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

  if (loading && deals.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading pipeline data...</p>
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
      <main className="min-h-screen py-8 px-4 bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto max-w-[1800px] space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 shadow-lg">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Sales Pipeline</h1>
                <p className="text-muted-foreground mt-1">Track and manage deals from LOI to closing</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/crm">
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
                  <ExternalLink className="w-4 h-4" />
                  CRM
                </button>
              </Link>
              <Link href="/crm/pipeline/analytics">
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
              </Link>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowNewDealModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                New Deal
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-card border-2 border-border rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by property address or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-muted border-2 border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-muted border-2 border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Active Deals
                    </p>
                    <p className="text-4xl font-extrabold text-foreground group-hover:text-accent transition-colors">
                      {summary.allTime.total_active_deals}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <TrendingUp className="w-7 h-7 text-accent" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pipeline Value
                    </p>
                    <p className="text-3xl font-extrabold text-foreground group-hover:text-accent transition-colors">
                      {formatCurrency(summary.allTime.active_pipeline_value || 0)}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <DollarSign className="w-7 h-7 text-accent" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Won This Month
                    </p>
                    <p className="text-4xl font-extrabold text-foreground group-hover:text-accent transition-colors">
                      {summary.timeRange.total_won}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(summary.timeRange.won_value || 0)}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <CheckCircle className="w-7 h-7 text-accent" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Conversion Rate
                    </p>
                    <p className="text-4xl font-extrabold text-accent group-hover:scale-110 transition-transform">
                      {summary.allTime.overall_conversion_rate || 0}%
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Percent className="w-7 h-7 text-accent" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LOI Accepted Column */}
            <DroppableStageColumn
              stage="loi_accepted"
              deals={dealsByStage.loi_accepted}
              onDealClick={setSelectedDealId}
              onRefresh={fetchData}
            />

            {/* Due Diligence Column */}
            <DroppableStageColumn
              stage="due_diligence"
              deals={dealsByStage.due_diligence}
              onDealClick={setSelectedDealId}
              onRefresh={fetchData}
            />

            {/* Contract Column */}
            <DroppableStageColumn
              stage="contract"
              deals={dealsByStage.contract}
              onDealClick={setSelectedDealId}
              onRefresh={fetchData}
            />

            {/* Closing Column */}
            <DroppableStageColumn
              stage="closing"
              deals={dealsByStage.closing}
              onDealClick={setSelectedDealId}
              onRefresh={fetchData}
            />
          </div>

          {/* Empty State */}
          {filteredDeals.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No deals found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first deal'}
              </p>
              {!searchQuery && filterPriority === 'all' && (
                <button
                  onClick={() => setShowNewDealModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-semibold transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create First Deal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragDeal ? (
            <div className="opacity-80">
              <DraggableDealCard
                deal={activeDragDeal}
                onDealClick={() => {}}
                isDragging={true}
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
