'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import {
  Mail,
  Send,
  MessageSquare,
  Clock,
  User,
  MapPin,
  DollarSign,
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  Reply,
  CheckCircle2,
  Inbox,
  Archive
} from 'lucide-react';
import Link from 'next/link';
import ReplyEmailModal from '@/components/loi/ReplyEmailModal';

type MailboxTab = 'inbox' | 'sent' | 'threads';

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
  id: string;
  tracking_id: string;
  property_address: string;
  agent_email: string;
  agent_name: string;
  agent_id: number;
  offer_price: number;
  realtor_email: string;
  realtor_name: string | null;
  sent_at: string;
  opened: boolean;
  clicked: boolean;
  replied: boolean;
  opened_at: string | null;
  replied_at: string | null;
  offer_type: string;
  status: string;
}

interface OutboundReply {
  id: string;
  loi_tracking_id: string;
  reply_to_email_reply_id: string | null;
  from_email: string;
  from_name: string;
  to_email: string;
  subject: string;
  html_content: string;
  sent_at: string;
  status: string;
}

interface EmailThread {
  tracking_id: string;
  property_address: string;
  agent_name: string;
  realtor_email: string;
  original_loi: LOIEmail;
  replies: EmailReply[];
  outbound_replies: OutboundReply[];
  last_activity: string;
  unread_count: number;
}

export default function MailboxPage() {
  const [activeTab, setActiveTab] = useState<MailboxTab>('inbox');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [sentEmails, setSentEmails] = useState<LOIEmail[]>([]);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);

  // UI State
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Fetch all email replies (inbox)
      const { data: repliesData, error: repliesError } = await supabase
        .from('email_replies')
        .select('*')
        .order('received_at', { ascending: false });

      if (repliesError) throw repliesError;
      setEmailReplies(repliesData || []);

      // Fetch all sent LOI emails
      const { data: sentData, error: sentError } = await supabase
        .from('loi_emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (sentError) throw sentError;
      setSentEmails(sentData || []);

      // Fetch outbound replies
      const { data: outboundData, error: outboundError } = await supabase
        .from('loi_email_outbound_replies')
        .select('*')
        .order('sent_at', { ascending: false });

      if (outboundError) throw outboundError;

      // Build email threads
      const threads = buildEmailThreads(sentData || [], repliesData || [], outboundData || []);
      setEmailThreads(threads);

    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildEmailThreads = (
    sent: LOIEmail[],
    replies: EmailReply[],
    outbound: OutboundReply[]
  ): EmailThread[] => {
    const threadMap = new Map<string, EmailThread>();

    // Group by tracking_id
    sent.forEach(loi => {
      const loiReplies = replies.filter(r => r.loi_tracking_id === loi.tracking_id);
      const loiOutbound = outbound.filter(o => o.loi_tracking_id === loi.tracking_id);

      const allDates = [
        loi.sent_at,
        ...loiReplies.map(r => r.received_at),
        ...loiOutbound.map(o => o.sent_at)
      ];

      const lastActivity = allDates.sort().reverse()[0] || loi.sent_at;

      threadMap.set(loi.tracking_id, {
        tracking_id: loi.tracking_id,
        property_address: loi.property_address,
        agent_name: loi.agent_name,
        realtor_email: loi.realtor_email,
        original_loi: loi,
        replies: loiReplies,
        outbound_replies: loiOutbound,
        last_activity: lastActivity,
        unread_count: loiReplies.length, // TODO: track read status
      });
    });

    return Array.from(threadMap.values()).sort((a, b) =>
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );
  };

  const handleReplyClick = (reply: EmailReply) => {
    setSelectedReply(reply);
    setIsReplyModalOpen(true);
  };

  const handleReplyModalClose = () => {
    setIsReplyModalOpen(false);
    setSelectedReply(null);
    fetchAllData();
  };

  const getStatusBadge = (loi: LOIEmail) => {
    if (loi.replied) {
      return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Replied</span>;
    }
    if (loi.clicked) {
      return <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Clicked</span>;
    }
    if (loi.opened) {
      return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Opened</span>;
    }
    return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Sent</span>;
  };

  const filteredReplies = emailReplies.filter(reply =>
    reply.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reply.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reply.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentEmails.filter(email =>
    email.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.realtor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredThreads = emailThreads.filter(thread =>
    thread.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.realtor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/crm">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mailbox</h1>
                <p className="text-sm text-muted-foreground">LOI emails and replies</p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'inbox'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {emailReplies.length > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                {emailReplies.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'sent'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="w-4 h-4" />
            Sent
            {sentEmails.length > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                {sentEmails.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'threads'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Conversations
            {emailThreads.filter(t => t.replies.length > 0).length > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                {emailThreads.filter(t => t.replies.length > 0).length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading emails...</p>
            </div>
          ) : (
            <>
              {/* Inbox Tab */}
              {activeTab === 'inbox' && (
                <div className="space-y-3">
                  {filteredReplies.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-lg text-muted-foreground">No replies yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Replies to LOI emails will appear here
                      </p>
                    </Card>
                  ) : (
                    filteredReplies.map((reply) => {
                      const loi = sentEmails.find(e => e.tracking_id === reply.loi_tracking_id);
                      return (
                        <Card key={reply.id} className="p-4 hover:shadow-md transition-shadow border-2 cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold text-foreground">{reply.from_email}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(reply.received_at).toLocaleString()}
                                </span>
                              </div>

                              {loi && (
                                <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{loi.property_address}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>${loi.offer_price.toLocaleString()}</span>
                                  </div>
                                </div>
                              )}

                              <p className="font-medium text-foreground mb-1">{reply.subject}</p>
                              {reply.text_content && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {reply.text_content}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleReplyClick(reply)}
                              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {/* Sent Tab */}
              {activeTab === 'sent' && (
                <div className="space-y-3">
                  {filteredSent.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-lg text-muted-foreground">No sent emails</p>
                    </Card>
                  ) : (
                    filteredSent.map((email) => (
                      <Card key={email.id} className="p-4 hover:shadow-md transition-shadow border-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-foreground">{email.realtor_email}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(email.sent_at).toLocaleString()}
                              </span>
                              {getStatusBadge(email)}
                            </div>

                            <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{email.property_address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>${email.offer_price.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{email.agent_name}</span>
                              </div>
                            </div>

                            <p className="font-medium text-foreground">LOI for {email.property_address}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {email.offer_type} • {email.status}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {email.opened && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Eye className="w-3 h-3" />
                                Opened {email.opened_at ? new Date(email.opened_at).toLocaleDateString() : ''}
                              </div>
                            )}
                            {email.replied && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Replied {email.replied_at ? new Date(email.replied_at).toLocaleDateString() : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Threads Tab */}
              {activeTab === 'threads' && (
                <div className="space-y-3">
                  {filteredThreads.filter(t => t.replies.length > 0).length === 0 ? (
                    <Card className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-lg text-muted-foreground">No conversations yet</p>
                    </Card>
                  ) : (
                    filteredThreads
                      .filter(t => t.replies.length > 0)
                      .map((thread) => (
                        <Card key={thread.tracking_id} className="p-4 hover:shadow-md transition-shadow border-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold text-foreground">{thread.property_address}</span>
                              </div>

                              <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{thread.realtor_email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span>${thread.original_loi.offer_price.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="font-medium">{thread.replies.length}</span> replies •{' '}
                                  <span className="font-medium">{thread.outbound_replies.length}</span> sent •{' '}
                                  Last activity: {new Date(thread.last_activity).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {thread.replies.length > 0 && (
                              <button
                                onClick={() => handleReplyClick(thread.replies[0])}
                                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                <Reply className="w-4 h-4" />
                                View Thread
                              </button>
                            )}
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedReply && isReplyModalOpen && (
        <ReplyEmailModal
          isOpen={isReplyModalOpen}
          onClose={handleReplyModalClose}
          emailReply={selectedReply}
          loiDetails={sentEmails.find(e => e.tracking_id === selectedReply.loi_tracking_id)}
        />
      )}
    </main>
  );
}
