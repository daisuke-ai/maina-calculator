'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X, Edit2, Save, TrendingUp, Calendar, DollarSign, User, Phone, Mail, FileText, Plus } from 'lucide-react';
import { PipelineDeal, STAGE_LABELS, PRIORITY_LABELS, VALID_TRANSITIONS } from '@/lib/pipeline/constants';
import { AGENTS } from '@/config/agents';

interface DealDetailModalProps {
  dealId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  contact_name: string | null;
  outcome: string | null;
  created_at: string;
  created_by: string;
}

export default function DealDetailModal({ dealId, onClose, onUpdate }: DealDetailModalProps) {
  const [deal, setDeal] = useState<PipelineDeal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);

  const [editData, setEditData] = useState({
    opportunity_value: '',
    offer_price: '',
    down_payment: '',
    monthly_payment: '',
    balloon_period: '',
    estimated_rehab_cost: '',
    expected_closing_date: '',
    priority: '',
    notes: '',
  });

  const [activityData, setActivityData] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    contact_name: '',
    outcome: 'neutral',
  });

  // Fetch deal and activities
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch deal details
      const dealRes = await fetch(`/api/crm/pipeline/deals/${dealId}`);
      const dealData = await dealRes.json();

      if (!dealRes.ok) {
        throw new Error(dealData.error || 'Failed to fetch deal');
      }

      setDeal(dealData.deal);

      // Initialize edit data
      setEditData({
        opportunity_value: dealData.deal.opportunity_value?.toString() || '',
        offer_price: dealData.deal.offer_price?.toString() || '',
        down_payment: dealData.deal.down_payment?.toString() || '',
        monthly_payment: dealData.deal.monthly_payment?.toString() || '',
        balloon_period: dealData.deal.balloon_period?.toString() || '',
        estimated_rehab_cost: dealData.deal.estimated_rehab_cost?.toString() || '',
        expected_closing_date: dealData.deal.expected_closing_date || '',
        priority: dealData.deal.priority,
        notes: dealData.deal.notes || '',
      });

      // Fetch activities
      const activitiesRes = await fetch(`/api/crm/pipeline/deals/${dealId}/activities`);
      const activitiesData = await activitiesRes.json();
      setActivities(activitiesData.activities || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dealId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updates = {
        opportunity_value: parseFloat(editData.opportunity_value),
        offer_price: editData.offer_price ? parseFloat(editData.offer_price) : null,
        down_payment: editData.down_payment ? parseFloat(editData.down_payment) : null,
        monthly_payment: editData.monthly_payment ? parseFloat(editData.monthly_payment) : null,
        balloon_period: editData.balloon_period ? parseInt(editData.balloon_period) : null,
        estimated_rehab_cost: editData.estimated_rehab_cost ? parseFloat(editData.estimated_rehab_cost) : null,
        expected_closing_date: editData.expected_closing_date || null,
        priority: editData.priority,
        notes: editData.notes || null,
      };

      const response = await fetch(`/api/crm/pipeline/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update deal');
      }

      setDeal(result.deal);
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveStage = async (newStage: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/crm/pipeline/deals/${dealId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stage: newStage, changed_by: 'ui' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to move deal');
      }

      await fetchData();
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddActivity = async () => {
    setError(null);
    try {
      if (!activityData.title) {
        setError('Activity title is required');
        return;
      }

      const response = await fetch(`/api/crm/pipeline/deals/${dealId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activityData,
          created_by: 'ui',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create activity');
      }

      // Reset form
      setActivityData({
        activity_type: 'note',
        title: '',
        description: '',
        contact_name: '',
        outcome: 'neutral',
      });
      setShowActivityForm(false);

      // Refresh activities
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 border-t-4 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black rounded-2xl p-8 border border-white/10 shadow-2xl">
          <p className="text-white font-semibold text-lg mb-4">Deal not found</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-semibold shadow-lg shadow-green-500/20"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[deal.stage] || [];
  const agent = AGENTS.find(a => a.id === deal.agent_id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{deal.property_address}</h2>
              <div className="flex gap-3 items-center flex-wrap">
                <span className="px-4 py-1.5 bg-green-500/20 text-green-500 rounded-full text-sm font-semibold border border-green-500/30 shadow-lg shadow-green-500/10">
                  {STAGE_LABELS[deal.stage]}
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/10">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-gray-300 text-sm font-medium">
                    {deal.probability_to_close}% probability
                  </span>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  deal.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10' :
                  deal.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10' :
                  deal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/10' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {PRIORITY_LABELS[deal.priority]}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-black/40 border border-red-500/50 rounded-xl text-white">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="p-6 grid grid-cols-3 gap-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Left Column: Deal Info */}
          <div className="col-span-2 space-y-5">
            {/* Financial Details */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                Financial Details
              </h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Opportunity Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.opportunity_value}
                      onChange={(e) => setEditData({ ...editData, opportunity_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                    />
                  ) : (
                    <p className="text-3xl font-bold text-green-500">{formatCurrency(deal.opportunity_value)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Offer Price</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.offer_price}
                      onChange={(e) => setEditData({ ...editData, offer_price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                    />
                  ) : (
                    <p className="text-xl font-bold text-white">{formatCurrency(deal.offer_price)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Down Payment</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.down_payment}
                      onChange={(e) => setEditData({ ...editData, down_payment: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-200">{formatCurrency(deal.down_payment)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Monthly Payment</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.monthly_payment}
                      onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-200">{formatCurrency(deal.monthly_payment)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Balloon Period</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.balloon_period}
                      onChange={(e) => setEditData({ ...editData, balloon_period: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                      placeholder="Years"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-200">{deal.balloon_period ? `${deal.balloon_period} years` : 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Estimated Rehab Cost</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.estimated_rehab_cost}
                      onChange={(e) => setEditData({ ...editData, estimated_rehab_cost: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-200">{formatCurrency(deal.estimated_rehab_cost)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <User className="w-5 h-5" />
                </div>
                Contact Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {deal.realtor_name && (
                  <div>
                    <p className="text-sm text-gray-400">Realtor</p>
                    <p className="font-semibold">{deal.realtor_name}</p>
                    {deal.realtor_email && <p className="text-sm text-gray-400">{deal.realtor_email}</p>}
                    {deal.realtor_phone && <p className="text-sm text-gray-400">{deal.realtor_phone}</p>}
                  </div>
                )}

                {deal.seller_name && (
                  <div>
                    <p className="text-sm text-gray-400">Seller</p>
                    <p className="font-semibold">{deal.seller_name}</p>
                    {deal.seller_email && <p className="text-sm text-gray-400">{deal.seller_email}</p>}
                    {deal.seller_phone && <p className="text-sm text-gray-400">{deal.seller_phone}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                Notes
              </h3>
              {isEditing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                  placeholder="Add notes about this deal..."
                />
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{deal.notes || 'No notes added yet'}</p>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/20 font-semibold"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                  disabled={isSaving}
                  className="px-8 py-3 bg-black/60 border border-white/20 text-white rounded-lg hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Activities */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  Activities
                  <span className="ml-2 px-2.5 py-0.5 bg-green-500/20 text-green-500 rounded-full text-sm font-bold">{activities.length}</span>
                </h3>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-sm hover:from-green-700 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </div>

              {/* Activity Form */}
              {showActivityForm && (
                <div className="mb-5 p-5 bg-black/60 border border-white/20 rounded-xl shadow-inner">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Type</label>
                      <select
                        value={activityData.activity_type}
                        onChange={(e) => setActivityData({ ...activityData, activity_type: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      >
                        <option value="note">Note</option>
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="inspection">Inspection</option>
                        <option value="offer">Offer</option>
                        <option value="counter_offer">Counter Offer</option>
                        <option value="milestone">Milestone</option>
                        <option value="task">Task</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Outcome</label>
                      <select
                        value={activityData.outcome}
                        onChange={(e) => setActivityData({ ...activityData, outcome: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      >
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={activityData.title}
                      onChange={(e) => setActivityData({ ...activityData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-lg text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      placeholder="Brief description of activity"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      value={activityData.description}
                      onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-lg text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      placeholder="Detailed notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddActivity}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Save Activity
                    </button>
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No activities yet</p>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="p-3 bg-black/60 border border-white/10 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
                            {activity.activity_type.replace('_', ' ').toUpperCase()}
                          </span>
                          {activity.outcome && (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              activity.outcome === 'positive' ? 'bg-green-500/20 text-green-500' :
                              activity.outcome === 'negative' ? 'bg-red-500/20 text-red-500' :
                              'bg-white/10 text-gray-400'
                            }`}>
                              {activity.outcome}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(activity.created_at)}</span>
                      </div>
                      <p className="font-semibold mb-1 text-white">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-300">{activity.description}</p>
                      )}
                      {activity.contact_name && (
                        <p className="text-xs text-gray-400 mt-2">Contact: {activity.contact_name}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Agent & Stage Actions */}
          <div className="space-y-5">
            {/* Agent Info */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <User className="w-5 h-5" />
                </div>
                Assigned Agent
              </h3>
              {agent && (
                <div>
                  <p className="font-semibold text-lg text-white">{agent.realName}</p>
                  <p className="text-sm text-gray-400">{agent.email}</p>
                </div>
              )}
            </div>

            {/* Key Dates */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                Key Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Expected Closing</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.expected_closing_date}
                      onChange={(e) => setEditData({ ...editData, expected_closing_date: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                  ) : (
                    <p className="font-semibold text-white">{formatDate(deal.expected_closing_date)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created</p>
                  <p className="font-semibold text-white">{formatDate(deal.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Last Updated</p>
                  <p className="font-semibold text-white">{formatDate(deal.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Priority</h3>
              {isEditing ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <p className={`font-bold text-xl ${
                  deal.priority === 'urgent' ? 'text-red-400' :
                  deal.priority === 'high' ? 'text-orange-400' :
                  deal.priority === 'medium' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {PRIORITY_LABELS[deal.priority]}
                </p>
              )}
            </div>

            {/* Stage Actions */}
            {deal.status === 'active' && allowedTransitions.length > 0 && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">Move to Next Stage</h3>
                <div className="space-y-3">
                  {allowedTransitions.map(stage => (
                    <button
                      key={stage}
                      onClick={() => handleMoveStage(stage)}
                      className={`w-full px-5 py-3 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        stage === 'won' ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-green-500/20' :
                        stage === 'lost' ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-red-500/20' :
                        'bg-black/60 hover:bg-black/80 text-white border border-white/20'
                      }`}
                    >
                      <span>→</span>
                      {STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Deal Status */}
            {deal.status !== 'active' && (
              <div className={`rounded-xl p-5 shadow-xl border-2 ${
                deal.status === 'won'
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}>
                <h3 className={`text-xl font-bold mb-2 ${
                  deal.status === 'won' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {deal.status === 'won' ? '🎉 Deal Won!' : '❌ Deal Lost'}
                </h3>
                {(deal.won_at || deal.lost_at) && (
                  <p className="text-sm text-white font-medium">
                    Closed on {formatDate(deal.won_at || deal.lost_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
