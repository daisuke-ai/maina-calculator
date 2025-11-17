'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReplyEmailModal from '@/components/loi/ReplyEmailModal';
import { Mail, Clock, User, MapPin, DollarSign } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading email replies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Replies</h1>
          <p className="mt-2 text-gray-600">
            View and respond to realtor replies on your LOI emails
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Replies</p>
                <p className="text-2xl font-bold text-gray-900">{replies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Last 24 Hours</p>
                <p className="text-2xl font-bold text-gray-900">
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
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Unique Realtors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(replies.map((r) => r.from_email)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Replies List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Replies</h2>
          </div>

          {replies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No email replies yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {replies.map((reply) => {
                const loi = loiDetails[reply.loi_tracking_id];

                return (
                  <div
                    key={reply.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Reply Header */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-1" />
                            <span className="font-medium text-gray-900">
                              {reply.from_email}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(reply.received_at).toLocaleString()}
                          </div>
                        </div>

                        {/* LOI Details */}
                        {loi && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="truncate">{loi.property_address}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                              <span>${loi.offer_price.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{loi.agent_name}</span>
                            </div>
                          </div>
                        )}

                        {/* Subject */}
                        <div className="mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Subject:
                          </span>{' '}
                          <span className="text-sm text-gray-900">{reply.subject}</span>
                        </div>

                        {/* Message Preview */}
                        {reply.text_content && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {reply.text_content}
                          </p>
                        )}
                      </div>

                      {/* Reply Button */}
                      <button
                        onClick={() => handleReplyClick(reply)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
    </div>
  );
}
