'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PipelineDeal, STAGE_ORDER } from '@/lib/pipeline/constants';
import { DroppableStageColumn } from './DroppableStageColumn';
import { DraggableDealCard } from './DraggableDealCard';
import DealDetailModal from './DealDetailModal';
import { RefreshCw, Plus } from 'lucide-react';

export function PipelineBoard() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/pipeline/deals');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch deals');
      }

      setDeals(data.deals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as PipelineDeal['stage'];

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistically update UI
    setDeals(prevDeals =>
      prevDeals.map(d =>
        d.id === dealId ? { ...d, stage: newStage } : d
      )
    );

    try {
      const response = await fetch(`/api/crm/pipeline/deals/${dealId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_stage: newStage,
          changed_by: 'ui',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to move deal');
      }

      // Update with server response
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.id === dealId ? result.deal : d
        )
      );
    } catch (err: any) {
      // Revert on error
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.id === dealId ? { ...d, stage: deal.stage } : d
        )
      );
      alert(`Failed to move deal: ${err.message}`);
    }
  };

  const handleDealClick = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const activeDeal = activeDealId ? deals.find(d => d.id === activeDealId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 border-t-4 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-black/40 border border-white/10 rounded-xl shadow-xl">
        <p className="font-bold mb-2 text-white text-lg">Error loading pipeline</p>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchDeals}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-semibold shadow-lg shadow-green-500/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sales Pipeline</h1>
          <p className="text-gray-400">
            {deals.length} active {deals.length === 1 ? 'deal' : 'deals'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDeals}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {STAGE_ORDER.slice(0, 4).map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage);
            return (
              <DroppableStageColumn
                key={stage}
                stage={stage}
                deals={stageDeals}
                onDealClick={handleDealClick}
                onRefresh={fetchDeals}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal && (
            <div className="opacity-50">
              <DraggableDealCard
                deal={activeDeal}
                onDealClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedDealId && (
        <DealDetailModal
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          onUpdate={fetchDeals}
        />
      )}
    </>
  );
}
