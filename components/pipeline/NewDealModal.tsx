'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AGENTS } from '@/config/agents';

interface NewDealModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDealModal({ onClose, onSuccess }: NewDealModalProps) {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">New Pipeline Deal</h2>
            <p className="text-sm text-gray-400 mt-1">Create a new deal in the pipeline</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="p-4 bg-black/40 border border-red-500/50 rounded-xl text-white">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Property Information */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Property Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Property Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Opportunity Value <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.opportunity_value}
                  onChange={(e) => setFormData({ ...formData, opportunity_value: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="250000"
                />
                <p className="text-xs text-gray-500 mt-2">Main tracking value for forecasting</p>
              </div>
            </div>
          </div>

          {/* Agent & Priority */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Agent & Priority</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Agent <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
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
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
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
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Financial Details <span className="text-xs text-gray-500 font-normal">(Optional)</span></h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Offer Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.offer_price}
                  onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="240000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Down Payment
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.down_payment}
                  onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Monthly Payment
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Balloon Period (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.balloon_period}
                  onChange={(e) => setFormData({ ...formData, balloon_period: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Estimated Rehab Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.estimated_rehab_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_rehab_cost: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Expected Closing Date
                </label>
                <input
                  type="date"
                  value={formData.expected_closing_date}
                  onChange={(e) => setFormData({ ...formData, expected_closing_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact Information (Optional) */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Contact Information <span className="text-xs text-gray-500 font-normal">(Optional)</span></h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Realtor Name
                </label>
                <input
                  type="text"
                  value={formData.realtor_name}
                  onChange={(e) => setFormData({ ...formData, realtor_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Realtor Email
                </label>
                <input
                  type="email"
                  value={formData.realtor_email}
                  onChange={(e) => setFormData({ ...formData, realtor_email: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="jane@realty.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Realtor Phone
                </label>
                <input
                  type="tel"
                  value={formData.realtor_phone}
                  onChange={(e) => setFormData({ ...formData, realtor_phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-lg">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none outline-none"
              placeholder="Add any additional notes about this deal..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-3 bg-black/60 border border-white/20 text-white rounded-lg hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/20 font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Deal...
                </>
              ) : (
                'Create Deal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
