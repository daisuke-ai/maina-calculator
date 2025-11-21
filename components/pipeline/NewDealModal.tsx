'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { AGENTS } from '@/config/agents';
import { PipelineType } from '@/lib/pipeline/constants';

interface NewDealModalProps {
  pipelineType: PipelineType;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDealModal({ pipelineType, onClose, onSuccess }: NewDealModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    property_address: '',
    opportunity_value: '',
    agent_id: '',
    offer_price: '',
    down_payment: '',
    monthly_payment: '',
    balloon_period: '',
    estimated_rehab_cost: '',
    expected_closing_date: '',
    realtor_name: '',
    realtor_email: '',
    realtor_phone: '',
    seller_name: '',
    seller_email: '',
    seller_phone: '',
    priority: 'medium',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.property_address || !formData.opportunity_value || !formData.agent_id) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Find agent details
      const selectedAgent = AGENTS.find(a => a.id === parseInt(formData.agent_id));
      if (!selectedAgent) {
        setError('Invalid agent selected');
        setLoading(false);
        return;
      }

      // Prepare data
      const dealData = {
        pipeline_type: pipelineType,
        property_address: formData.property_address,
        opportunity_value: parseFloat(formData.opportunity_value),
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.realName,
        agent_email: selectedAgent.email,
        offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
        down_payment: formData.down_payment ? parseFloat(formData.down_payment) : null,
        monthly_payment: formData.monthly_payment ? parseFloat(formData.monthly_payment) : null,
        balloon_period: formData.balloon_period ? parseInt(formData.balloon_period) : null,
        estimated_rehab_cost: formData.estimated_rehab_cost ? parseFloat(formData.estimated_rehab_cost) : null,
        expected_closing_date: formData.expected_closing_date || null,
        realtor_name: formData.realtor_name || null,
        realtor_email: formData.realtor_email || null,
        realtor_phone: formData.realtor_phone || null,
        seller_name: formData.seller_name || null,
        seller_email: formData.seller_email || null,
        seller_phone: formData.seller_phone || null,
        priority: formData.priority,
        notes: formData.notes || null,
        created_by: 'ui',
      };

      // Create deal
      const response = await fetch('/api/crm/pipeline/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create deal');
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-lg border">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">New Deal</h2>
            <p className="text-sm text-muted-foreground">Create a new pipeline deal</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Property Information */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Property Information</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Property Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Opportunity Value <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.opportunity_value}
                  onChange={(e) => setFormData({ ...formData, opportunity_value: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="250000"
                />
                <p className="text-xs text-muted-foreground mt-1">Main tracking value for forecasting</p>
              </div>
            </div>
          </div>

          {/* Agent & Priority */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Agent & Priority</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Agent <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select Agent</option>
                  {AGENTS.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.realName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Details (Optional) */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">
              Financial Details <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Offer Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.offer_price}
                  onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="240000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Down Payment
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.down_payment}
                  onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Monthly Payment
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Balloon Period (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.balloon_period}
                  onChange={(e) => setFormData({ ...formData, balloon_period: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Estimated Rehab Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.estimated_rehab_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_rehab_cost: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Expected Closing Date
                </label>
                <input
                  type="date"
                  value={formData.expected_closing_date}
                  onChange={(e) => setFormData({ ...formData, expected_closing_date: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information (Optional) */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">
              Contact Information <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Realtor Name
                </label>
                <input
                  type="text"
                  value={formData.realtor_name}
                  onChange={(e) => setFormData({ ...formData, realtor_name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Realtor Email
                </label>
                <input
                  type="email"
                  value={formData.realtor_email}
                  onChange={(e) => setFormData({ ...formData, realtor_email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="jane@realty.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Realtor Phone
                </label>
                <input
                  type="tel"
                  value={formData.realtor_phone}
                  onChange={(e) => setFormData({ ...formData, realtor_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              placeholder="Add any additional notes about this deal..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Deal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
