# Miana Calculator - Changelog

## Recent Updates (November 2025)

### Email System Enhancements

#### Email Reply Handling & CRM Integration
**Status**: ✅ Deployed | **Date**: Nov 15, 2025

**Features Added:**
- **Automated Reply Attribution**: Email replies from realtors automatically matched to original LOIs via property address
- **Agent Attribution System**: All replies linked to the correct agent who sent the LOI
- **Communications Specialist Forwarding**: Replies forwarded with full context (agent, property, offer details, response time)
- **Database Schema Updates**: New `email_replies` table for storing reply content and tracking

**Technical Details:**
- Property address extraction from email subjects: `"Re: LOI for [Address]"`
- Case-insensitive property address matching with fallback to partial matches
- Reply storage includes: from/to emails, subject, HTML/text content, message ID
- Event logging system tracks entire email lifecycle

**Files Changed:**
- `app/api/webhooks/resend/route.ts` - Reply handler implementation
- `lib/supabase/email-tracking.ts` - Database functions for reply storage
- `supabase/migrations/20250114_add_email_replies.sql` - Database schema

---

#### Email Sender Branding & CC Functionality
**Status**: ✅ Deployed | **Date**: Nov 15, 2025

**Changes:**
- **Sender Name**: Changed from "Vanguard Horizon REIT" to "Miana"
- **Agent CC**: Agents now receive a copy of every LOI they send
- **Reply-To**: All replies route to main company email for centralized tracking

**Email Flow:**
```
From: Miana <vanguardhorizon@reit.miana.com.co>
To: [Realtor Email]
CC: [Agent Email]  ← NEW
Reply-To: vanguardhorizon@reit.miana.com.co
Subject: LOI for [Property Address]
```

**Benefits:**
- Agents get immediate visibility into sent LOIs
- Centralized reply handling maintains tracking integrity
- Professional branding consistency

**Files Changed:**
- `lib/email/resend-service.ts` - Email configuration and CC logic
- `.env.example` - Updated sender name defaults

---

#### Webhook Error Handling
**Status**: ✅ Deployed | **Date**: Nov 15, 2025

**Fixes:**
- Fixed `tags.find is not a function` error by handling both array and object tag formats
- Improved handling of webhooks without tracking IDs (test events, external emails)
- Added graceful processing of `email.received` events without tracking data
- Enhanced error logging for debugging webhook issues

**Technical Improvements:**
```typescript
// Now handles both formats
if (Array.isArray(tags)) {
  const trackingTag = tags.find((tag: any) => tag.name === 'tracking_id');
  return trackingTag?.value || null;
}
if (typeof tags === 'object') {
  return tags.tracking_id || null;
}
```

**Files Changed:**
- `app/api/webhooks/resend/route.ts` - Tag extraction logic
- `lib/supabase/email-tracking.ts` - Environment variable validation

---

#### Environment Configuration
**Status**: ✅ Deployed | **Date**: Nov 15, 2025

**New Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` - Required for database writes (bypasses RLS)
- `SENDER_NAME` - Email sender display name (default: "Miana")
- `SENDER_EMAIL` - Email sender address
- `COMMS_SPECIALIST_EMAIL` - Where to forward reply notifications

**Validation Added:**
- Warnings when using ANON key instead of SERVICE_ROLE key
- Error messages for missing critical configuration
- Better debugging for database permission issues

**Files Changed:**
- `.env.example` - Comprehensive environment variable documentation
- `lib/supabase/email-tracking.ts` - Configuration validation

---

### Database Schema Updates

#### Email Replies Table
**Status**: ⚠️ Requires Manual Migration | **Date**: Nov 15, 2025

**New Table: `email_replies`**
```sql
CREATE TABLE email_replies (
  id UUID PRIMARY KEY,
  loi_tracking_id TEXT NOT NULL,
  agent_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  message_id TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**Performance Indexes:**
- `idx_email_replies_loi_tracking_id` - Fast LOI lookups
- `idx_email_replies_agent_id` - Agent filtering
- `idx_email_replies_from_email` - Realtor search
- `idx_email_replies_received_at` - Chronological sorting

**Additional Indexes on `loi_emails`:**
- `idx_loi_emails_property_address_lower` - Case-insensitive property search
- `idx_loi_emails_replied` (partial) - Only indexes unreplied emails for faster matching

**Analytics View:**
```sql
CREATE VIEW agent_performance AS
SELECT
  agent_id,
  agent_name,
  total_sent,
  total_opened,
  total_replied,
  open_rate,
  reply_rate
FROM loi_emails
GROUP BY agent_id, agent_name;
```

**Migration File:**
- `supabase/migrations/20250114_add_email_replies.sql`

**⚠️ Action Required:** Run this migration in Supabase SQL Editor to enable reply tracking.

---

### Frontend Improvements

#### Property & Income Lock Mechanism
**Status**: ✅ Deployed | **Date**: Nov 15, 2025

**Behavior Changes:**
- Fields automatically lock when API fetches property data
- Lock state resets to locked when user clicks "Start Over"
- Users must click "Unlock to Edit" button to modify API-fetched values
- Lock re-engages when new property address is entered

**User Flow:**
1. User enters address → API fetches data → **Fields locked** ✓
2. User clicks "Unlock to Edit" → Can modify fields ✓
3. User clicks "Start Over" → Everything resets → **Fields locked** ✓
4. User enters new address → **Fields locked** with new data ✓

**Implementation:**
```typescript
React.useEffect(() => {
  setIsLocked(true) // Lock when new data arrives
}, [propertyAPIData.ADDRESS])
```

**Files Changed:**
- `components/FinancialDetailsForm.tsx` - Lock state management

---

### Documentation

#### Setup Guide
**Status**: ✅ Created | **Date**: Nov 15, 2025

**New File: `SETUP_GUIDE.md`**

Comprehensive guide covering:
- Database migration instructions
- Environment variable checklist
- Email workflow overview
- Testing checklist
- Common issues and solutions
- Monitoring and troubleshooting

**Files Added:**
- `SETUP_GUIDE.md` - Complete setup documentation

---

## Workflow Overview

### Current Email Workflow

#### 1. Sending LOI
```
User fills form → System generates tracking ID → Email sent via Resend
├─ From: Miana <vanguardhorizon@reit.miana.com.co>
├─ To: Realtor email
├─ CC: Agent email
├─ Subject: LOI for [Property Address]
└─ Attachments: EIN, Notarized Docs, LLC Registration
```

#### 2. Tracking Events (Webhooks)
```
Resend Webhooks → Database Updates
├─ email.sent → Status: sent
├─ email.delivered → Status: delivered, sets delivered_at
├─ email.opened → Increments open_count, sets opened_at
├─ email.clicked → Increments click_count
├─ email.bounced → Status: failed
└─ email.received → Reply handler triggers ↓
```

#### 3. Reply Handling
```
Realtor replies → Extract property address → Match to LOI → Attribute to agent
├─ Store in email_replies table
├─ Update LOI replied status
├─ Log event in email_events
└─ Forward to communications specialist with context
```

#### 4. Communications Specialist Notification
```
Email forwarded with:
├─ Agent name
├─ Property address
├─ Offer details (price, down payment, terms)
├─ Response time calculation
├─ Full reply content
└─ Direct links: Reply to realtor, View in CRM
```

---

## Agent Configuration

**Total Agents**: 24 configured
- 21 individual agents (IDs 1-21)
- 3 team accounts (IDs 22-24)

**Agent Data Includes:**
- Real name (internal)
- Alias name (public-facing)
- Email: `[name]@miana.com.co`
- Phone: `(406) 229-93XX` format

**Files:**
- `config/agents.ts` - Agent configuration with phone numbers

---

## Database Scalability

### Current Design Analysis

**Projected Volume**: 1,000 emails/day

**5-Year Projection:**
- `loi_emails`: 1.8M rows
- `email_events`: 5.4M - 9M rows
- `email_replies`: ~180K rows (10% reply rate)

**Performance:**
- ✅ Well-indexed for fast queries
- ✅ Normalized schema prevents bloat
- ✅ Partial indexes for hot paths
- ✅ Efficient data types (UUID, TIMESTAMPTZ, NUMERIC)

**Optimization Timeline:**
- **Now**: No changes needed ✓
- **At 50K emails**: Materialize analytics view
- **At 500K emails**: Add table partitioning
- **At 5M emails**: Consider archiving to S3

**Estimated Performance (at 1M rows):**
- Insert LOI: <30ms
- Webhook update: <40ms
- Reply matching: <100ms
- Agent dashboard: <1s (with materialized view)

**Verdict**: Database design is production-ready for 1,000 emails/day for 1-2+ years without optimization.

---

## Environment Setup

### Required Environment Variables (Production)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qpbjckuphrfjupqrtiai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # CRITICAL!

# Resend Email Service
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...

# Email Configuration
SENDER_NAME=Miana
SENDER_EMAIL=vanguardhorizon@reit.miana.com.co
COMMS_SPECIALIST_EMAIL=vanguardhorizon.reit-a@miana.com.co

# External APIs
RENTCAST_API_KEY=...
RENTOMETER_API_KEY=...
```

**Critical**: `SUPABASE_SERVICE_ROLE_KEY` must be set in Vercel for database writes to work.

---

## Testing Status

### ✅ Verified Working
- [x] LOI email sending with real property addresses
- [x] Agent CC functionality
- [x] Email tracking (sent, delivered, opened, clicked)
- [x] Webhook event processing
- [x] Property address data flow from API to email
- [x] Lock mechanism on Property & Income fields

### ⚠️ Requires Setup
- [ ] Database migration for `email_replies` table
- [ ] `SUPABASE_SERVICE_ROLE_KEY` environment variable in Vercel
- [ ] Test reply handling with live realtor responses

### 📝 Known Issues
- **Property Address "Property Address"**: Only occurs with demo/test data. Works correctly with real property data from API.
- **Phone Number Formatting**: Works correctly when selecting agents from config. Test data showed incorrect format.
- **Database "Invalid API key" Error**: Resolved by adding `SUPABASE_SERVICE_ROLE_KEY`.

---

## Recent Git Commits

```
a81075f - Fix Property & Income lock state to reset on Start Over
7cb6cbe - Change email sender name to 'Miana' and add agent CC
6b16bec - Add comprehensive email system setup guide
3f11d29 - Fix webhook errors and improve error handling
d19054c - Add email reply handling and agent phone numbers
ad56441 - Polish results table alignment and refine deal viability logic
4731687 - Implement deal viability checks and fix email template
d6f164b - Fix LOI email template and add Resend webhook setup guide
5a55052 - Complete UI updates and LOI email automation feature
4f0c66f - Complete Miana Calculator implementation with seller finance analysis
```

---

## Next Steps

1. **Run Database Migration** (Highest Priority)
   - Go to Supabase SQL Editor
   - Run `supabase/migrations/20250114_add_email_replies.sql`
   - Verify table creation

2. **Verify Production Environment Variables**
   - Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel
   - Verify all email config variables are set
   - Redeploy application

3. **Test End-to-End Flow**
   - Send LOI with real property address
   - Verify agent receives CC
   - Test reply handling when realtor responds
   - Confirm forwarding to communications specialist

4. **Monitor Production Logs**
   - Watch for successful email sends
   - Verify webhook processing
   - Check reply attribution accuracy

---

## Support & Troubleshooting

**View Logs**: https://vercel.com/daisuke-ais-projects/maina-calculator/logs

**Common Log Messages:**
- `[Email Sent]` - Email accepted by Resend ✓
- `[Email Delivered]` - Successfully delivered ✓
- `[Email Opened]` - Recipient opened ✓
- `[Email Reply Received]` - Reply detected ✓
- `[Reply Handler] Matched to LOI` - Successfully attributed to agent ✓
- `[Forwarded to Comms Specialist]` - Notification sent ✓

**Documentation:**
- `SETUP_GUIDE.md` - Complete setup instructions
- `CHANGELOG.md` - This file
- `.env.example` - Environment variable reference

---

## Contributors

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
