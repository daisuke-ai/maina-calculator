'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReplyEmailModal from '@/components/loi/ReplyEmailModal';
import { Card } from '@/components/ui/card';
import { Mail, Clock, User, MapPin, DollarSign, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface EmailReply {
  id: string;
  loi_tracking_id: string;
  agent_id: number;
  agent_name: string;
  from_email: string;
  to_email: string;
  subject: string;
  text_content: string | null;
  html_content: string | null;
  message_id: string | null;
  received_at: string;
  created_at: string;
}

interface LOIEmail {
  tracking_id: string;
  property_address: string;
  agent_email: string;
  agent_name: string;
  offer_price: number;
  realtor_email: string;
  realtor_name: string | null;
}

export default function EmailRepliesPage() {
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [loiDetails, setLoiDetails] = useState<Record<string, LOIEmail>>({});
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmailReplies();
  }, []);

  const fetchEmailReplies = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Fetch all email replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('email_replies')
        .select('*')
        .order('received_at', { ascending: false });

      if (repliesError) throw repliesError;

      setReplies(repliesData || []);

      // Fetch corresponding LOI details
      const trackingIds = [...new Set(repliesData?.map((r) => r.loi_tracking_id))];

      if (trackingIds.length > 0) {
        const { data: loiData, error: loiError } = await supabase
          .from('loi_emails')
          .select('tracking_id, property_address, agent_email, agent_name, offer_price, realtor_email, realtor_name')
          .in('tracking_id', trackingIds);

        if (loiError) throw loiError;

        // Create lookup map
        const loiMap: Record<string, LOIEmail> = {};
        loiData?.forEach((loi) => {
          loiMap[loi.tracking_id] = loi;
        });
        setLoiDetails(loiMap);
      }
    } catch (error) {
      console.error('Error fetching email replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (reply: EmailReply) => {
    setSelectedReply(reply);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReply(null);
    // Refresh replies after sending
    fetchEmailReplies();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading email replies...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted shadow-lg mb-4">
              <MessageSquare className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Email Replies</h1>
            <p className="text-lg text-muted-foreground">View and respond to realtor replies on your LOI emails</p>
          </div>
          <Link href="/crm">
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
              <ArrowLeft className="w-4 h-4" />
              Back to CRM
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Replies</p>
                <p className="text-2xl font-bold text-foreground">{replies.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Last 24 Hours</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    replies.filter(
                      (r) =>
                        new Date(r.received_at) >
                        new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Unique Realtors</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(replies.map((r) => r.from_email)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Replies List */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Recent Replies</h2>
          <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
            {replies.length === 0 ? (
              <div className="p-16 text-center">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No email replies yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
              {replies.map((reply) => {
                const loi = loiDetails[reply.loi_tracking_id];

                return (
                  <div
                    key={reply.id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Reply Header */}
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="flex items-center text-sm">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-2">
                              <Mail className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-medium text-foreground">
                              {reply.from_email}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(reply.received_at).toLocaleString()}
                          </div>
                        </div>

                        {/* LOI Details */}
                        {loi && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-accent" />
                              <span className="truncate text-foreground">{loi.property_address}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="w-4 h-4 mr-2 text-accent" />
                              <span className="text-foreground">${loi.offer_price.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <User className="w-4 h-4 mr-2 text-accent" />
                              <span className="text-foreground">{loi.agent_name}</span>
                            </div>
                          </div>
                        )}

                        {/* Subject */}
                        <div className="mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Subject:
                          </span>{' '}
                          <span className="text-sm text-foreground">{reply.subject}</span>
                        </div>

                        {/* Message Preview */}
                        {reply.text_content ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {reply.text_content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            [Email content not available - click Reply to view in modal]
                          </p>
                        )}
                      </div>

                      {/* Reply Button */}
                      <button
                        onClick={() => handleReplyClick(reply)}
                        className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-all shadow-lg whitespace-nowrap"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </Card>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedReply && (
        <ReplyEmailModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          emailReply={selectedReply}
          loiDetails={loiDetails[selectedReply.loi_tracking_id]}
        />
      )}
    </main>
  );
}
