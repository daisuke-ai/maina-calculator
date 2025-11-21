'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X, Edit2, Save, TrendingUp, Calendar, DollarSign, User, Phone, Mail, FileText, Plus, ArrowRight } from 'lucide-react';
import { PipelineDeal, STAGE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, VALID_TRANSITIONS } from '@/lib/pipeline/constants';
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8 border shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8 border shadow-lg">
          <p className="text-foreground font-semibold mb-4">Deal not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[deal.stage] || [];
  const agent = AGENTS.find(a => a.id === deal.agent_id);
  const priorityColor = PRIORITY_COLORS[deal.priority as keyof typeof PRIORITY_COLORS] || '#6B7280';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-lg border">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{deal.property_address}</h2>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold border border-accent/20">
                  {STAGE_LABELS[deal.stage]}
                </span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {deal.probability_to_close}% probability
                  </span>
                </div>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${priorityColor}20`,
                    color: priorityColor
                  }}
                >
                  {PRIORITY_LABELS[deal.priority]}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="p-4 grid grid-cols-3 gap-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Left Column: Deal Info */}
          <div className="col-span-2 space-y-4">
            {/* Financial Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Financial Details
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Opportunity Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.opportunity_value}
                      onChange={(e) => setEditData({ ...editData, opportunity_value: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-lg font-bold text-foreground">{formatCurrency(deal.opportunity_value)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Offer Price</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.offer_price}
                      onChange={(e) => setEditData({ ...editData, offer_price: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-base font-semibold text-foreground">{formatCurrency(deal.offer_price)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Down Payment</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.down_payment}
                      onChange={(e) => setEditData({ ...editData, down_payment: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{formatCurrency(deal.down_payment)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Payment</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.monthly_payment}
                      onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{formatCurrency(deal.monthly_payment)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Balloon Period</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.balloon_period}
                      onChange={(e) => setEditData({ ...editData, balloon_period: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Years"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{deal.balloon_period ? `${deal.balloon_period} years` : 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Est. Rehab Cost</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.estimated_rehab_cost}
                      onChange={(e) => setEditData({ ...editData, estimated_rehab_cost: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{formatCurrency(deal.estimated_rehab_cost)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(deal.realtor_name || deal.seller_name) && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {deal.realtor_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Realtor</p>
                      <p className="font-medium">{deal.realtor_name}</p>
                      {deal.realtor_email && <p className="text-xs text-muted-foreground">{deal.realtor_email}</p>}
                      {deal.realtor_phone && <p className="text-xs text-muted-foreground">{deal.realtor_phone}</p>}
                    </div>
                  )}

                  {deal.seller_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Seller</p>
                      <p className="font-medium">{deal.seller_name}</p>
                      {deal.seller_email && <p className="text-xs text-muted-foreground">{deal.seller_email}</p>}
                      {deal.seller_phone && <p className="text-xs text-muted-foreground">{deal.seller_phone}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Notes
              </h3>
              {isEditing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Add notes about this deal..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.notes || 'No notes added yet'}</p>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Saving...
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
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Activities */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Activities
                  <span className="ml-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">{activities.length}</span>
                </h3>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {/* Activity Form */}
              {showActivityForm && (
                <div className="mb-3 p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Type</label>
                      <select
                        value={activityData.activity_type}
                        onChange={(e) => setActivityData({ ...activityData, activity_type: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="note">Note</option>
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="inspection">Inspection</option>
                        <option value="offer">Offer</option>
                        <option value="milestone">Milestone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Outcome</label>
                      <select
                        value={activityData.outcome}
                        onChange={(e) => setActivityData({ ...activityData, outcome: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={activityData.title}
                      onChange={(e) => setActivityData({ ...activityData, title: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Activity title"
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      value={activityData.description}
                      onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      placeholder="Description..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddActivity}
                      className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90 transition font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="p-2 bg-muted rounded-lg border">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-medium">
                            {activity.activity_type.replace('_', ' ')}
                          </span>
                          {activity.outcome && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              activity.outcome === 'positive' ? 'bg-green-500/10 text-green-600' :
                              activity.outcome === 'negative' ? 'bg-red-500/10 text-red-600' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {activity.outcome}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                      </div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Agent & Actions */}
          <div className="space-y-4">
            {/* Agent Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Agent
              </h3>
              {agent && (
                <div>
                  <p className="font-medium">{agent.realName}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
              )}
            </div>

            {/* Key Dates */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Key Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Expected Closing</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.expected_closing_date}
                      onChange={(e) => setEditData({ ...editData, expected_closing_date: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="font-medium">{formatDate(deal.expected_closing_date)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(deal.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Priority</h3>
              {isEditing ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <p
                  className="font-bold text-base"
                  style={{ color: priorityColor }}
                >
                  {PRIORITY_LABELS[deal.priority]}
                </p>
              )}
            </div>

            {/* Stage Actions */}
            {deal.status === 'active' && allowedTransitions.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Move to Next Stage</h3>
                <div className="space-y-2">
                  {allowedTransitions.map(stage => (
                    <button
                      key={stage}
                      onClick={() => handleMoveStage(stage)}
                      className={`w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                        stage === 'won' ? 'bg-green-500 hover:bg-green-600 text-white' :
                        stage === 'lost' ? 'bg-red-500 hover:bg-red-600 text-white' :
                        'bg-secondary hover:bg-secondary/80 text-secondary-foreground border'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                      {STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Deal Status */}
            {deal.status !== 'active' && (
              <div className={`rounded-lg p-4 border-2 ${
                deal.status === 'won'
                  ? 'bg-green-500/10 border-green-500'
                  : 'bg-red-500/10 border-red-500'
              }`}>
                <h3 className={`font-bold mb-1 ${
                  deal.status === 'won' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {deal.status === 'won' ? 'Deal Won' : 'Deal Lost'}
                </h3>
                {(deal.won_at || deal.lost_at) && (
                  <p className="text-sm text-muted-foreground">
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
