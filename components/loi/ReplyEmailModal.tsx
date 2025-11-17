'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ReplyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailReply: {
    id: string;
    from_email: string;
    subject: string;
    text_content?: string;
    html_content?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Reply to Realtor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Original Message Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">From:</span>{' '}
                <span className="text-gray-900">{emailReply.from_email}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Received:</span>{' '}
                <span className="text-gray-900">
                  {new Date(emailReply.received_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Subject:</span>{' '}
                <span className="text-gray-900">{emailReply.subject}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Agent:</span>{' '}
                <span className="text-gray-900">{emailReply.agent_name}</span>
              </div>
              {loiDetails && (
                <>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Property:</span>{' '}
                    <span className="text-gray-900">{loiDetails.property_address}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offer Price:</span>{' '}
                    <span className="text-gray-900">
                      ${loiDetails.offer_price.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Original Message Content */}
          {emailReply.text_content && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Original Message:
              </label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {emailReply.text_content}
                </pre>
              </div>
            </div>
          )}

          {/* Reply Composer */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Reply:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* CC Agent Checkbox */}
          {loiDetails && (
            <div className="mb-4">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">✓ Reply sent successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
