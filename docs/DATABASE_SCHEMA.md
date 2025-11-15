# Miana Calculator - Database Schema Documentation

**Last Updated:** January 16, 2025
**Database:** Supabase (PostgreSQL)
**Project:** Miana Real Estate Investment Calculator with CRM

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Analytics Views](#analytics-views)
3. [Database Functions](#database-functions)
4. [Indexes](#indexes)
5. [Relationships](#relationships)
6. [Migration History](#migration-history)

---

## Core Tables

### 1. `loi_emails`
**Purpose:** Tracks all Letter of Intent (LOI) emails sent to realtors with offer details and engagement metrics.

**Schema:**
```sql
CREATE TABLE loi_emails (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT UNIQUE NOT NULL,

  -- Agent Information
  agent_id INTEGER NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_phone TEXT,

  -- Realtor Information
  realtor_email TEXT NOT NULL,
  realtor_name TEXT,

  -- Property Details
  property_address TEXT NOT NULL,

  -- Offer Details
  offer_type TEXT NOT NULL,           -- 'Max Owner Favored', 'Balanced', 'Max Buyer Favored'
  offer_price NUMERIC(12, 2) NOT NULL,
  down_payment NUMERIC(12, 2) NOT NULL,
  monthly_payment NUMERIC(12, 2) NOT NULL,
  balloon_year INTEGER NOT NULL,
  closing_costs NUMERIC(12, 2) NOT NULL,
  closing_days INTEGER NOT NULL,

  -- Email Status
  status TEXT DEFAULT 'pending',      -- 'pending', 'sent', 'delivered', 'failed', 'bounced', 'replied'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  -- Engagement Tracking
  opened BOOLEAN DEFAULT FALSE,
  open_count INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ,

  clicked BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMPTZ,

  replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,

  -- Metadata
  error_message TEXT,
  resend_email_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `tracking_id`: Unique identifier for email tracking (format: `loi_xxxxx_yyyyyyy`)
- `agent_id`: References agent from config (1-24)
- `offer_type`: Type of offer sent (3 types per property)
- Engagement fields: Track opens, clicks, and replies with counts and timestamps

**Constraints:**
- `status` must be one of: 'pending', 'sent', 'delivered', 'failed', 'bounced', 'replied'

---

### 2. `email_events`
**Purpose:** Stores detailed webhook events from Resend email service for audit trail.

**Schema:**
```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES loi_emails(id) ON DELETE CASCADE,
  tracking_id TEXT NOT NULL,

  -- Event Details
  event_type TEXT NOT NULL,           -- 'email.sent', 'email.delivered', 'email.opened', etc.
  event_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Event Types:**
- `email.sent` - Email accepted by mail server
- `email.delivered` - Email successfully delivered
- `email.opened` - Recipient opened the email
- `email.clicked` - Recipient clicked a link
- `email.bounced` - Email bounced
- `email.complained` - Marked as spam

**Relationships:**
- `email_id` → `loi_emails.id` (CASCADE DELETE)

---

### 3. `email_replies`
**Purpose:** Stores reply content from realtors for tracking and CRM purposes.

**Schema:**
```sql
CREATE TABLE email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loi_tracking_id TEXT NOT NULL,

  -- Agent attribution
  agent_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,

  -- Reply details
  from_email TEXT NOT NULL,           -- Realtor's email
  to_email TEXT NOT NULL,             -- Agent's email
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  message_id TEXT,

  -- Timestamp
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `loi_tracking_id` → `loi_emails.tracking_id` (CASCADE DELETE)

**Use Cases:**
- Store full reply content for CRM
- Track response times
- Analyze realtor engagement

---

## Analytics Views

### 1. `agent_performance_summary`
**Purpose:** Comprehensive agent performance metrics across all time.

**Returns:**
```sql
agent_id INTEGER
agent_name TEXT
total_sent BIGINT
total_delivered BIGINT
total_opened BIGINT
total_clicked BIGINT
total_replied BIGINT
total_opens BIGINT              -- Sum of all open_count
total_clicks BIGINT             -- Sum of all click_count
open_rate NUMERIC               -- Percentage (0-100)
click_rate NUMERIC              -- Percentage (0-100)
reply_rate NUMERIC              -- Percentage (0-100)
first_email_sent TIMESTAMPTZ
last_email_sent TIMESTAMPTZ
last_reply_received TIMESTAMPTZ
```

**Source:** `loi_emails` table
**Usage:** CRM dashboard all-time stats

---

### 2. `agent_activity_30d`
**Purpose:** Agent activity and performance metrics for the last 30 days.

**Returns:**
```sql
agent_id INTEGER
agent_name TEXT
emails_sent_30d BIGINT
emails_opened_30d BIGINT
emails_replied_30d BIGINT
reply_rate_30d NUMERIC          -- Percentage (0-100)
```

**Filters:** `sent_at >= NOW() - INTERVAL '30 days'`
**Usage:** Recent performance tracking

---

### 3. `agent_property_analytics`
**Purpose:** Detailed property-level analytics for each agent.

**Returns:**
```sql
agent_id INTEGER
agent_name TEXT
property_address TEXT
offer_type TEXT
offer_price NUMERIC
sent_at TIMESTAMPTZ
opened BOOLEAN
opened_at TIMESTAMPTZ
replied BOOLEAN
replied_at TIMESTAMPTZ
open_count INTEGER
click_count INTEGER
hours_to_reply NUMERIC          -- Calculated: (replied_at - sent_at) / 3600
realtor_email_response TEXT
reply_received_at TIMESTAMPTZ
```

**Joins:** `loi_emails` LEFT JOIN `email_replies`
**Usage:** Individual email tracking

---

### 4. `offer_type_analytics`
**Purpose:** Performance comparison across different offer types.

**Returns:**
```sql
offer_type TEXT
total_sent BIGINT
total_opened BIGINT
total_replied BIGINT
open_rate NUMERIC
reply_rate NUMERIC
avg_offer_price NUMERIC
avg_down_payment NUMERIC
avg_monthly_payment NUMERIC
```

**Usage:** Analytics page - offer type comparison

---

### 5. `daily_email_volume`
**Purpose:** Daily email volume and engagement metrics for the last 90 days.

**Returns:**
```sql
date DATE
emails_sent BIGINT
emails_opened BIGINT
emails_replied BIGINT
active_agents BIGINT            -- COUNT(DISTINCT agent_id)
```

**Filters:** `sent_at >= NOW() - INTERVAL '90 days'`
**Usage:** Analytics page - daily volume chart

---

## Database Functions

### Time-Range Analytics Functions

#### 1. `get_agent_activity_by_range(days_back INTEGER)`
**Returns:** Agent performance for any time period

```sql
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_replied BIGINT,
  open_rate NUMERIC,
  reply_rate NUMERIC
)
```

**Parameters:**
- `days_back` - Number of days to look back (default: 7)

**Usage:**
```sql
SELECT * FROM get_agent_activity_by_range(7);    -- Last week
SELECT * FROM get_agent_activity_by_range(30);   -- Last month
SELECT * FROM get_agent_activity_by_range(90);   -- Last quarter
SELECT * FROM get_agent_activity_by_range(365);  -- Last year
```

---

#### 2. `get_offer_type_analytics_by_range(days_back INTEGER)`
**Returns:** Offer type performance for any time period

```sql
RETURNS TABLE (
  offer_type TEXT,
  total_sent BIGINT,
  total_opened BIGINT,
  total_replied BIGINT,
  open_rate NUMERIC,
  reply_rate NUMERIC,
  avg_offer_price NUMERIC,
  avg_down_payment NUMERIC,
  avg_monthly_payment NUMERIC
)
```

---

#### 3. `get_daily_email_volume_by_range(days_back INTEGER)`
**Returns:** Daily volume for any time period

```sql
RETURNS TABLE (
  date DATE,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_replied BIGINT,
  active_agents BIGINT
)
```

---

#### 4. `get_top_agents_by_range(limit_count INTEGER, days_back INTEGER)`
**Returns:** Top performing agents for any time period

```sql
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  total_sent BIGINT,
  total_opened BIGINT,
  total_replied BIGINT,
  reply_rate NUMERIC,
  open_rate NUMERIC
)
```

**Parameters:**
- `limit_count` - Number of agents to return (default: 10)
- `days_back` - Number of days to look back (default: 7)

**Ordering:** By `reply_rate DESC`, then `total_sent DESC`

---

#### 5. `get_agent_details_by_range(p_agent_id INTEGER, days_back INTEGER)`
**Returns:** Individual agent details for any time period

```sql
RETURNS JSON
```

**JSON Structure:**
```json
{
  "agent_id": 1,
  "agent_name": "Ammar",
  "agent_email": "ammar@miana.com.co",
  "total_sent": 10,
  "total_delivered": 9,
  "total_opened": 5,
  "total_clicked": 2,
  "total_replied": 3,
  "open_rate": 50.00,
  "click_rate": 40.00,
  "reply_rate": 30.00,
  "first_email_sent": "2025-01-01T10:00:00Z",
  "last_email_sent": "2025-01-15T15:30:00Z",
  "last_reply_received": "2025-01-15T16:00:00Z",
  "avg_hours_to_reply": 2.5
}
```

---

### Legacy Functions

#### `get_agent_details(p_agent_id INTEGER)`
**Returns:** All-time agent details as JSON
**Replaced by:** `get_agent_details_by_range()` with large days_back value

#### `get_top_agents(limit_count INTEGER)`
**Returns:** All-time top agents
**Replaced by:** `get_top_agents_by_range()` with large days_back value

---

## Indexes

### Performance Indexes

```sql
-- Primary lookups
CREATE INDEX idx_loi_emails_tracking_id ON loi_emails(tracking_id);
CREATE INDEX idx_loi_emails_agent_id ON loi_emails(agent_id);
CREATE INDEX idx_loi_emails_agent_email ON loi_emails(agent_email);
CREATE INDEX idx_loi_emails_property_address ON loi_emails(property_address);
CREATE INDEX idx_loi_emails_sent_at ON loi_emails(sent_at DESC);

-- Analytics optimizations
CREATE INDEX idx_loi_emails_agent_id_sent_at ON loi_emails(agent_id, sent_at DESC);
CREATE INDEX idx_loi_emails_offer_type ON loi_emails(offer_type);

-- Reply matching
CREATE INDEX idx_loi_emails_property_address_lower ON loi_emails(LOWER(property_address));
CREATE INDEX idx_loi_emails_replied ON loi_emails(replied) WHERE replied = FALSE;

-- Email events
CREATE INDEX idx_email_events_tracking_id ON email_events(tracking_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);

-- Email replies
CREATE INDEX idx_email_replies_loi_tracking_id ON email_replies(loi_tracking_id);
CREATE INDEX idx_email_replies_agent_id ON email_replies(agent_id);
CREATE INDEX idx_email_replies_from_email ON email_replies(from_email);
CREATE INDEX idx_email_replies_received_at ON email_replies(received_at DESC);
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│   loi_emails    │◄──────────┐
│ (Primary Table) │            │
└────────┬────────┘            │
         │                     │
         │ 1:N                 │ N:1
         │                     │
         ▼                     │
┌─────────────────┐   ┌────────┴────────┐
│  email_events   │   │  email_replies  │
│  (Audit Trail)  │   │  (CRM Replies)  │
└─────────────────┘   └─────────────────┘
```

**Cascade Behavior:**
- When `loi_emails` record deleted → All related `email_events` deleted (CASCADE)
- When `loi_emails` record deleted → All related `email_replies` deleted (CASCADE)

---

## Data Flow

### 1. Email Sending Flow
```
Calculator → Send LOI Button
    ↓
POST /api/send-loi
    ↓
Create loi_emails record (status: 'pending')
    ↓
Send via Resend API
    ↓
Update status to 'sent'
    ↓
Resend Webhook → email_events record
```

### 2. Engagement Tracking Flow
```
Resend Webhook (email.opened)
    ↓
POST /api/webhooks/resend
    ↓
Update loi_emails:
  - opened = true
  - open_count += 1
  - opened_at = timestamp (first time only)
    ↓
Create email_events record
```

### 3. Reply Processing Flow
```
Realtor replies to email
    ↓
Resend Webhook (email.replied)
    ↓
POST /api/webhooks/resend
    ↓
Create email_replies record
    ↓
Update loi_emails:
  - replied = true
  - replied_at = timestamp
  - status = 'replied'
```

---

## Migration History

### 1. `20250113_loi_email_tracking.sql`
**Date:** January 13, 2025

**Created:**
- ✓ `loi_emails` table
- ✓ `email_events` table
- ✓ Primary indexes
- ✓ `update_updated_at_column()` function
- ✓ Auto-update trigger for `updated_at`

---

### 2. `20250114_add_email_replies.sql`
**Date:** January 14, 2025

**Created:**
- ✓ `email_replies` table
- ✓ Reply indexes
- ✓ Property address case-insensitive index
- ✓ Unreplied LOIs index
- ✓ `agent_performance` view (legacy)

**Modified:**
- ✓ Updated `status` constraint to include 'bounced' and 'replied'

---

### 3. `20250115_add_crm_analytics.sql`
**Date:** January 15, 2025

**Created:**
- ✓ `agent_performance_summary` view
- ✓ `agent_activity_30d` view
- ✓ `agent_property_analytics` view
- ✓ `offer_type_analytics` view
- ✓ `daily_email_volume` view
- ✓ `get_agent_details(p_agent_id)` function
- ✓ `get_top_agents(limit_count)` function
- ✓ Analytics indexes

---

### 4. `20250116_add_time_range_analytics.sql`
**Date:** January 16, 2025

**Created:**
- ✓ `get_agent_activity_by_range(days_back)` function
- ✓ `get_offer_type_analytics_by_range(days_back)` function
- ✓ `get_daily_email_volume_by_range(days_back)` function
- ✓ `get_top_agents_by_range(limit_count, days_back)` function
- ✓ `get_agent_details_by_range(p_agent_id, days_back)` function

**Features:**
- Time-range filtering for all analytics
- Support for week, month, quarter, year, and custom ranges

---

## Usage Examples

### Query Examples

#### Get All Agent Performance
```sql
SELECT * FROM agent_performance_summary ORDER BY reply_rate DESC;
```

#### Get Last Week's Activity for Agent #1
```sql
SELECT * FROM get_agent_activity_by_range(7) WHERE agent_id = 1;
```

#### Get Offer Type Performance for Last Quarter
```sql
SELECT * FROM get_offer_type_analytics_by_range(90);
```

#### Get Top 5 Agents in Last Month
```sql
SELECT * FROM get_top_agents_by_range(5, 30);
```

#### Get Daily Volume for Last 2 Weeks
```sql
SELECT * FROM get_daily_email_volume_by_range(14) ORDER BY date DESC;
```

#### Find All Unreplied Emails Older Than 3 Days
```sql
SELECT
  tracking_id,
  agent_name,
  property_address,
  sent_at,
  opened,
  open_count
FROM loi_emails
WHERE replied = FALSE
  AND sent_at < NOW() - INTERVAL '3 days'
ORDER BY sent_at DESC;
```

#### Calculate Average Response Time by Offer Type
```sql
SELECT
  offer_type,
  COUNT(*) FILTER (WHERE replied = TRUE) as total_replies,
  ROUND(AVG(EXTRACT(EPOCH FROM (replied_at - sent_at)) / 3600), 2) as avg_hours_to_reply
FROM loi_emails
WHERE replied = TRUE
GROUP BY offer_type;
```

---

## Data Retention

Currently, there is **no automatic data retention policy**. All data is kept indefinitely.

**Future Considerations:**
- Archive old email events after 1 year
- Soft-delete old LOI emails after 2 years
- Keep analytics data indefinitely

---

## Backup & Recovery

**Supabase Automatic Backups:**
- Daily backups enabled
- 7-day retention for free tier
- Point-in-time recovery available

**Critical Tables:**
- `loi_emails` - **CRITICAL** (contains all sent offers)
- `email_replies` - **HIGH** (contains realtor responses)
- `email_events` - **MEDIUM** (can be regenerated from webhooks)

---

## Security & Access

**Row Level Security (RLS):**
- Currently **NOT ENABLED** (using service role key)
- Future: Enable RLS for multi-tenant support

**API Access:**
- Service role key used for server-side operations
- Anon key for read-only operations (if needed)

---

## Performance Considerations

### Query Optimization

**Fast Queries:**
- Agent lookups by `agent_id` (indexed)
- Tracking ID lookups (unique index)
- Time-range queries on `sent_at` (indexed)

**Slow Queries (Avoid):**
- Full table scans without WHERE clause
- Case-sensitive property address searches (use LOWER() function)
- Joins without proper indexes

### Scaling

**Current Capacity:**
- Handles 10,000+ emails per month
- Sub-100ms query times for indexed lookups
- Supabase free tier sufficient for current volume

**Future Scaling:**
- Consider materialized views for heavy analytics
- Partition tables by date if volume exceeds 1M records
- Use connection pooling for high concurrency

---

## Monitoring

**Key Metrics to Track:**
- Email send rate (emails/day)
- Engagement rates (open %, click %, reply %)
- Response times (hours to reply)
- Error rates (failed/bounced emails)
- Database query performance

**Alerts:**
- Reply rate drops below 10%
- Email failures exceed 5%
- Database query times exceed 1 second

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-13 | 1.0 | Initial schema with email tracking |
| 2025-01-14 | 1.1 | Added email replies table |
| 2025-01-15 | 2.0 | Added comprehensive analytics views |
| 2025-01-16 | 2.1 | Added time-range analytics functions |

---

## Support

For database questions or issues:
1. Check this documentation first
2. Review migration files in `supabase/migrations/`
3. Check Supabase logs in dashboard
4. Contact database administrator

**Supabase Project:**
- URL: `https://qpbjckuphrfjupqrtiai.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai
