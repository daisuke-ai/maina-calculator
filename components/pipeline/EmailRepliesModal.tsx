'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Clock, User, MapPin, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import ReplyEmailModal from '@/components/loi/ReplyEmailModal';

interface EmailReply {
  id: string;
  loi_tracking_id: string;
  agent_id: number;
  agent_name: string;
  from_email: string;
  to_email: string;
  subject: string;
  text_content?: string | null;
  html_content?: string | null;
  message_id?: string | null;
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

interface EmailRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailRepliesModal({ isOpen, onClose }: EmailRepliesModalProps) {
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [loiDetails, setLoiDetails] = useState<Record<string, LOIEmail>>({});
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmailReplies();
    }
  }, [isOpen]);

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
      const trackingIds = [...new Set(repliesData?.map((r: EmailReply) => r.loi_tracking_id))];

      if (trackingIds.length > 0) {
        const { data: loiData, error: loiError } = await supabase
          .from('loi_emails')
          .select('tracking_id, property_address, agent_email, agent_name, offer_price, realtor_email, realtor_name')
          .in('tracking_id', trackingIds);

        if (loiError) throw loiError;

        // Create lookup map
        const loiMap: Record<string, LOIEmail> = {};
        loiData?.forEach((loi: LOIEmail) => {
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
    setIsReplyModalOpen(true);
  };

  const handleReplyModalClose = () => {
    setIsReplyModalOpen(false);
    setSelectedReply(null);
    // Refresh replies after sending
    fetchEmailReplies();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col m-4">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Email Replies</h2>
                <p className="text-sm text-muted-foreground">Realtor responses to LOI emails</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading email replies...</p>
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No email replies yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Replies to LOI emails will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => {
                  const loi = loiDetails[reply.loi_tracking_id];

                  return (
                    <Card key={reply.id} className="p-4 hover:shadow-md transition-shadow border-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Reply Header */}
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-accent" />
                              <span className="font-medium text-foreground">{reply.from_email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(reply.received_at).toLocaleString()}
                            </div>
                          </div>

                          {/* Property & Agent Info */}
                          {loi && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{loi.property_address}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{reply.agent_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="w-3 h-3" />
                                <span>${loi.offer_price.toLocaleString()}</span>
                              </div>
                            </div>
                          )}

                          {/* Subject */}
                          <p className="text-sm font-medium text-foreground mb-2">{reply.subject}</p>

                          {/* Message Preview */}
                          {reply.text_content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {reply.text_content}
                            </p>
                          )}
                        </div>

                        {/* Reply Button */}
                        <button
                          onClick={() => handleReplyClick(reply)}
                          className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Reply
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedReply && isReplyModalOpen && (
        <ReplyEmailModal
          isOpen={isReplyModalOpen}
          onClose={handleReplyModalClose}
          emailReply={selectedReply}
          loiDetails={loiDetails[selectedReply.loi_tracking_id]}
        />
      )}
    </>
  );
}
