'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Send, Mail, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReplyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailReply: {
    id: string;
    from_email: string;
    subject: string;
    text_content?: string | null;
    html_content?: string | null;
    received_at: string;
    loi_tracking_id: string;
    agent_name: string;
  };
  loiDetails?: {
    property_address: string;
    agent_email: string;
    offer_price: number;
  };
}

interface ThreadMessage {
  type: 'loi' | 'inbound' | 'outbound';
  from: string;
  to: string;
  subject: string;
  content: string;
  html_content?: string;
  timestamp: string;
  id: string;
}

export default function ReplyEmailModal({
  isOpen,
  onClose,
  emailReply,
  loiDetails,
}: ReplyEmailModalProps) {
  const [message, setMessage] = useState('');
  const [ccAgent, setCcAgent] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showThread, setShowThread] = useState(true);
  const [loadingThread, setLoadingThread] = useState(true);
  const [thread, setThread] = useState<ThreadMessage[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchEmailThread();
    }
  }, [isOpen, emailReply.loi_tracking_id]);

  const fetchEmailThread = async () => {
    setLoadingThread(true);
    try {
      if (!supabase) return;

      // Fetch original LOI
      const { data: loiData } = await supabase
        .from('loi_emails')
        .select('*')
        .eq('tracking_id', emailReply.loi_tracking_id)
        .single();

      // Fetch all inbound replies
      const { data: repliesData } = await supabase
        .from('email_replies')
        .select('*')
        .eq('loi_tracking_id', emailReply.loi_tracking_id)
        .order('received_at', { ascending: true });

      // Fetch all outbound replies
      const { data: outboundData } = await supabase
        .from('loi_email_outbound_replies')
        .select('*')
        .eq('loi_tracking_id', emailReply.loi_tracking_id)
        .order('sent_at', { ascending: true });

      // Build thread
      const messages: ThreadMessage[] = [];

      // Add original LOI
      if (loiData) {
        messages.push({
          type: 'loi',
          from: `${loiData.agent_name} <${loiData.agent_email}>`,
          to: loiData.realtor_email,
          subject: `LOI for ${loiData.property_address}`,
          content: loiData.html_content || 'Original LOI email',
          html_content: loiData.html_content,
          timestamp: loiData.sent_at,
          id: loiData.id,
        });
      }

      // Add all replies in chronological order
      const allReplies = [
        ...(repliesData || []).map((r: any) => ({ ...r, type: 'inbound' as const, timestamp: r.received_at })),
        ...(outboundData || []).map((r: any) => ({ ...r, type: 'outbound' as const, timestamp: r.sent_at })),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      allReplies.forEach(reply => {
        if (reply.type === 'inbound') {
          messages.push({
            type: 'inbound',
            from: reply.from_email,
            to: reply.to_email,
            subject: reply.subject,
            content: reply.text_content || reply.html_content || 'No content',
            html_content: reply.html_content,
            timestamp: reply.timestamp,
            id: reply.id,
          });
        } else {
          messages.push({
            type: 'outbound',
            from: `${reply.from_name} <${reply.from_email}>`,
            to: reply.to_email,
            subject: reply.subject,
            content: reply.html_content || 'No content',
            html_content: reply.html_content,
            timestamp: reply.timestamp,
            id: reply.id,
          });
        }
      });

      setThread(messages);
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/loi/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyToEmailReplyId: emailReply.id,
          message: formatMessageAsHTML(message),
          ccAgent,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setMessage('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatMessageAsHTML = (text: string): string => {
    // Convert plain text to HTML with line breaks
    const paragraphs = text.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`);

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${paragraphs.join('')}
          <br><br>
          <p style="color: #666; font-size: 14px;">
            ---<br>
            Miana<br>
            Real Estate Investment Trust
          </p>
        </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reply to Realtor</h2>
            <p className="text-sm text-gray-600 mt-1">
              {loiDetails?.property_address || 'Property'} • ${loiDetails?.offer_price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Email Thread Section */}
            <div className="border-2 border-gray-200 rounded-lg">
              <button
                onClick={() => setShowThread(!showThread)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Email Thread ({thread.length} messages)
                  </span>
                </div>
                {showThread ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {showThread && (
                <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                  {loadingThread ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading thread...</p>
                    </div>
                  ) : thread.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No messages in thread</p>
                  ) : (
                    thread.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`border-l-4 pl-4 py-2 ${
                          msg.type === 'loi'
                            ? 'border-blue-500 bg-blue-50'
                            : msg.type === 'outbound'
                            ? 'border-green-500 bg-green-50'
                            : 'border-orange-500 bg-orange-50'
                        }`}
                      >
                        {/* Message Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-sm text-gray-900">
                                {msg.type === 'loi'
                                  ? 'Original LOI'
                                  : msg.type === 'outbound'
                                  ? 'You'
                                  : 'Realtor'}
                              </span>
                              <span className="text-xs text-gray-600">→</span>
                              <span className="text-sm text-gray-600">{msg.to}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="w-3 h-3" />
                              {new Date(msg.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              msg.type === 'loi'
                                ? 'bg-blue-200 text-blue-800'
                                : msg.type === 'outbound'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-orange-200 text-orange-800'
                            }`}
                          >
                            {msg.type === 'loi' ? 'Sent' : msg.type === 'outbound' ? 'Sent' : 'Received'}
                          </span>
                        </div>

                        {/* Message Subject */}
                        <p className="text-sm font-medium text-gray-900 mb-2">{msg.subject}</p>

                        {/* Message Content */}
                        <div className="bg-white rounded p-3 text-sm text-gray-700 max-h-48 overflow-y-auto">
                          {msg.html_content ? (
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: msg.html_content }}
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-5 h-5 text-gray-600" />
                <label className="block text-sm font-semibold text-gray-900">Your Reply:</label>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* CC Agent Checkbox */}
            {loiDetails && (
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ccAgent}
                    onChange={(e) => setCcAgent(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    CC Agent ({loiDetails.agent_email})
                  </span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">✓ Reply sent successfully!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
