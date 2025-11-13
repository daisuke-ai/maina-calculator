// components/SendLOIModal.tsx

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { AGENTS, Agent } from '@/config/agents';
import { OfferResult } from '@/lib/calculator/types';
import { formatCurrency } from '@/lib/utils';
import { Mail, User, Phone, Building, Clock, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SendLOIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: OfferResult;
  propertyAddress: string;
  askingPrice: number;
  monthlyRent: number;
}

export function SendLOIModal({
  open,
  onOpenChange,
  offer,
  propertyAddress,
  askingPrice,
  monthlyRent,
}: SendLOIModalProps) {
  // Form state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [realtorEmail, setRealtorEmail] = useState('');
  const [realtorName, setRealtorName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [closingDays, setClosingDays] = useState(20);

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedAgent) {
      setError('Please select an agent');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-loi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          agentEmail: selectedAgent.email,
          agentName: selectedAgent.aliasName,
          agentPhone: agentPhone,
          realtorEmail,
          realtorName: realtorName,
          propertyAddress,
          offerType: offer.offer_type,
          offerPrice: offer.final_offer_price,
          downPayment: offer.down_payment,
          monthlyPayment: offer.monthly_payment,
          balloonYear: offer.balloon_period,
          closingCosts: offer.final_offer_price * 0.02, // 2% closing costs
          closingDays,
          askingPrice,
          monthlyRent,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[LOI Send Error]', result);
        const errorMsg = result.details
          ? `Validation Error: ${JSON.stringify(result.details, null, 2)}`
          : result.error || 'Failed to send email';
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send LOI email');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setRealtorEmail('');
    setRealtorName('');
    setAgentPhone('');
    setClosingDays(20);
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogClose onClose={handleClose} />

        <DialogHeader>
          <DialogTitle>Send Letter of Intent</DialogTitle>
          <DialogDescription>
            Send this {offer.offer_type} offer to the realtor via email
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Email Sent Successfully!</h3>
            <p className="text-muted-foreground">The LOI has been sent to {realtorEmail}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Agent Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4" />
                Select Agent
              </label>
              <select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = AGENTS.find((a) => a.id === parseInt(e.target.value));
                  setSelectedAgent(agent || null);
                }}
                required
                className="w-full h-11 px-4 text-sm text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
              >
                <option value="">Choose an agent...</option>
                {AGENTS.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.aliasName} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="w-4 h-4" />
                Agent Phone
              </label>
              <input
                type="tel"
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value)}
                placeholder="(406) 229-9325"
                required
                className="w-full h-11 px-4 text-sm text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
              />
            </div>

            {/* Realtor Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4" />
                Realtor Email
              </label>
              <input
                type="email"
                value={realtorEmail}
                onChange={(e) => setRealtorEmail(e.target.value)}
                placeholder="realtor@example.com"
                required
                className="w-full h-11 px-4 text-sm text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
              />
            </div>

            {/* Realtor Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building className="w-4 h-4" />
                Realtor Name
              </label>
              <input
                type="text"
                value={realtorName}
                onChange={(e) => setRealtorName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full h-11 px-4 text-sm text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
              />
            </div>

            {/* Closing Timeline */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="w-4 h-4" />
                Closing Timeline (Days)
              </label>
              <input
                type="number"
                value={closingDays}
                onChange={(e) => setClosingDays(parseInt(e.target.value))}
                min="1"
                max="180"
                required
                className="w-full h-11 px-4 text-sm text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
              />
            </div>

            {/* Offer Summary */}
            <div className="bg-muted rounded-xl p-4 border-2 border-border">
              <h4 className="text-sm font-bold text-foreground mb-3">Offer Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-semibold text-foreground">{propertyAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offer Type</p>
                  <p className="font-semibold text-foreground">{offer.offer_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offer Price</p>
                  <p className="font-semibold text-accent">{formatCurrency(offer.final_offer_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Down Payment</p>
                  <p className="font-semibold text-foreground">{formatCurrency(offer.down_payment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-semibold text-foreground">{formatCurrency(offer.monthly_payment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balloon Year</p>
                  <p className="font-semibold text-foreground">Year {offer.balloon_period}</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Error</p>
                  <p className="text-sm text-destructive/90 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 h-12 px-6 font-semibold text-foreground bg-secondary border-2 border-border rounded-xl transition-all duration-200 hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedAgent || !realtorEmail || !agentPhone || !realtorName}
                className="flex-1 h-12 px-6 font-bold text-accent-foreground bg-accent rounded-xl shadow-lg transition-all duration-200 hover:bg-accent/90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send LOI Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
