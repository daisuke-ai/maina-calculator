# CRM System Testing Checklist

**Project:** Miana Calculator - CRM & Email Tracking System
**Last Updated:** January 16, 2025
**Purpose:** Comprehensive testing guide to verify all CRM functionality

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Calculator & LOI Generation](#calculator--loi-generation)
3. [Email Sending & Tracking](#email-sending--tracking)
4. [Webhook Integration](#webhook-integration)
5. [CRM Dashboard](#crm-dashboard)
6. [CRM Analytics](#crm-analytics)
7. [Agent Detail Pages](#agent-detail-pages)
8. [Time Range Filtering](#time-range-filtering)
9. [Database Verification](#database-verification)
10. [Performance Testing](#performance-testing)
11. [Error Handling](#error-handling)

---

## Pre-Testing Setup

### ✅ Environment Verification

- [ ] **Local Development Server Running**
  - [ ] Navigate to project directory
  - [ ] Run `npm run dev`
  - [ ] Verify server starts on `http://localhost:3000`
  - [ ] No console errors on startup

- [ ] **Environment Variables Set**
  - [ ] Check `.env.local` exists
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
  - [ ] `RESEND_API_KEY` is set
  - [ ] `RENTCAST_API_KEY` is set

- [ ] **Database Migrations Applied**
  - [ ] Open Supabase SQL Editor
  - [ ] Verify `loi_emails` table exists
  - [ ] Verify `email_events` table exists
  - [ ] Verify `email_replies` table exists
  - [ ] Verify all 5 analytics views exist
  - [ ] Verify all 10 functions exist
  - [ ] Run test query: `SELECT * FROM agent_performance_summary LIMIT 1;`

- [ ] **Test Data Available**
  - [ ] At least 1 property address ready to test
  - [ ] Test email address you can access
  - [ ] Known working property: `1332 1st Ave, Terre Haute, IN 47807`

---

## Calculator & LOI Generation

### ✅ Property Search & Data Fetch

- [ ] **Address Input**
  - [ ] Navigate to `http://localhost:3000`
  - [ ] See the "Miana Seller Finance Tool" header
  - [ ] Address input field is visible
  - [ ] Enter test address: `1332 1st Ave, Terre Haute, IN 47807`
  - [ ] Click "Fetch Property Data" button
  - [ ] Loading state shows (spinner visible)

- [ ] **Property Data Loaded**
  - [ ] Property details card appears
  - [ ] Listed price shows correct value
  - [ ] Monthly rent displays
  - [ ] Property tax displays
  - [ ] Insurance estimate displays
  - [ ] HOA fee displays (or $0)
  - [ ] Property image shows (if available)

### ✅ Financial Details Form

- [ ] **Form Fields Visible**
  - [ ] Listed Price field (should be locked with lock icon)
  - [ ] Monthly Rent field (should be locked with lock icon)
  - [ ] Monthly Property Tax field (should be locked)
  - [ ] Monthly Insurance field (should be locked)
  - [ ] Monthly HOA Fee field (should be locked)
  - [ ] Monthly Other Fees field (should be editable, default $150)

- [ ] **Lock/Unlock Functionality**
  - [ ] Click lock icon on Listed Price
  - [ ] Field becomes editable with green border
  - [ ] Change value
  - [ ] Click unlock icon again
  - [ ] Field locks back
  - [ ] Repeat for other locked fields
  - [ ] Verify all locks work independently

- [ ] **Rehab Cost**
  - [ ] Rehab cost field visible
  - [ ] Enter test value (e.g., $10,000)
  - [ ] Value accepts numbers only
  - [ ] Shows proper formatting

### ✅ Analysis & Offer Generation

- [ ] **Analyze Property Button**
  - [ ] "Analyze Property" button is green and prominent
  - [ ] Button shows calculator icon
  - [ ] Click the button
  - [ ] Loading state shows ("Calculating Offers...")
  - [ ] Wait for results

- [ ] **Three Offers Generated**
  - [ ] Results section appears below
  - [ ] Three columns visible:
    - [ ] Max Owner Favored (left)
    - [ ] Balanced (middle)
    - [ ] Max Buyer Favored (right)
  - [ ] Each shows:
    - [ ] Offer Price
    - [ ] Down Payment (0%)
    - [ ] Monthly Payment
    - [ ] Balloon Period
    - [ ] Net Rental Yield (green if > 0)
    - [ ] Total Investment
    - [ ] Total Gain
    - [ ] Rehab Cost

- [ ] **Investment Analysis Table**
  - [ ] Full table visible below offers
  - [ ] All financial metrics shown:
    - [ ] Listed Price
    - [ ] Offer Price
    - [ ] Down Payment
    - [ ] Monthly Payment
    - [ ] Balloon Period
    - [ ] Closing Costs
    - [ ] Rehab Cost
    - [ ] Total Investment
    - [ ] Monthly Rent
    - [ ] Monthly Expenses
    - [ ] Net Monthly Cashflow
    - [ ] Net Rental Yield
    - [ ] Cashflow at Balloon
    - [ ] Equity at Balloon
    - [ ] Total Gain
  - [ ] All calculations look correct
  - [ ] Green highlighting on positive values

- [ ] **Export Functions**
  - [ ] PDF export button visible for each offer
  - [ ] Excel export button visible for each offer
  - [ ] Click PDF button
  - [ ] PDF downloads successfully
  - [ ] Open PDF and verify:
    - [ ] All offer details present
    - [ ] Property address shown
    - [ ] Financial metrics visible
    - [ ] Formatting looks professional
  - [ ] Click Excel button
  - [ ] Excel file downloads
  - [ ] Open Excel and verify data

### ✅ LOI Email Sending

- [ ] **Send LOI Modal**
  - [ ] "Send LOI" button visible for each offer
  - [ ] Click "Send LOI" on Max Owner Favored
  - [ ] Modal opens with title "Send Letter of Intent"
  - [ ] Form fields present:
    - [ ] Your Name (required)
    - [ ] Your Email (required)
    - [ ] Your Phone (required)
    - [ ] Realtor Email (required)
    - [ ] Realtor Name (optional)
    - [ ] Agent Selection (required, dropdown with 24 agents)
    - [ ] Closing Days (required, default 45)

- [ ] **Agent Selection**
  - [ ] Click agent dropdown
  - [ ] All 24 agents listed:
    - [ ] Ammar, Ada, Elif, Aylin, Farhat, Lina, Fazil, Mina
    - [ ] Ozan, Burakh, Noyaan, Emir, Sara, Mehmet, Tabeeb
    - [ ] Eleena, Ayla, Arda, Hannan, Anna, Eda
    - [ ] Team A, Team B, Team C
  - [ ] Select an agent (e.g., "Ammar")
  - [ ] Selection shows in field

- [ ] **Form Validation**
  - [ ] Click "Send LOI" with empty fields
  - [ ] Error messages appear for required fields
  - [ ] Fill in all required fields:
    - Your Name: `Test User`
    - Your Email: `your-test-email@example.com`
    - Your Phone: `555-1234`
    - Realtor Email: `realtor-test@example.com`
    - Realtor Name: `Test Realtor`
    - Agent: Select one
    - Closing Days: `45`
  - [ ] All fields accept input correctly

- [ ] **Email Sending Process**
  - [ ] Click "Send LOI" button in modal
  - [ ] Loading state shows
  - [ ] Success message appears: "LOI sent successfully"
  - [ ] Modal stays open showing confirmation
  - [ ] Tracking ID displayed (format: `loi_xxxxx_yyyyyyy`)
  - [ ] Can click "Close" to dismiss modal

- [ ] **Send Multiple LOIs**
  - [ ] Send LOI for Balanced offer
  - [ ] Use different agent
  - [ ] Verify success
  - [ ] Send LOI for Max Buyer Favored
  - [ ] Use third agent
  - [ ] Verify success
  - [ ] Total: 3 LOIs sent for same property

---

## Email Sending & Tracking

### ✅ Email Delivery Verification

- [ ] **Check Email Inbox**
  - [ ] Open realtor email inbox (`realtor-test@example.com`)
  - [ ] New email received from agent email
  - [ ] Subject line: "Letter of Intent - [Property Address]"
  - [ ] Sender name shows as "Miana" or agent name
  - [ ] Email body contains:
    - [ ] Property address
    - [ ] Offer price
    - [ ] Down payment amount
    - [ ] Monthly payment
    - [ ] Balloon period
    - [ ] Closing costs
    - [ ] Closing timeline
    - [ ] Your contact information
    - [ ] Agent contact information
    - [ ] Professional formatting

- [ ] **Email Attachments**
  - [ ] PDF attachment present
  - [ ] Download and open PDF
  - [ ] PDF contains complete offer details
  - [ ] Additional documents attached:
    - [ ] IRS EIN Letter (if configured)
    - [ ] Notarized Documents (if configured)
    - [ ] LLC Registration (if configured)

- [ ] **Email Links**
  - [ ] Tracking pixel present (invisible 1x1 image)
  - [ ] Any links in email are clickable
  - [ ] Links include tracking parameters

### ✅ Engagement Tracking

- [ ] **Open Tracking**
  - [ ] Open the email in inbox
  - [ ] Wait 30 seconds
  - [ ] Refresh your browser
  - [ ] Navigate to CRM dashboard (`http://localhost:3000/crm`)
  - [ ] Find the agent you used
  - [ ] Verify "Total Opened" increased
  - [ ] Open rate percentage updated

- [ ] **Click Tracking** (if email has links)
  - [ ] Click a link in the email
  - [ ] Wait 30 seconds
  - [ ] Refresh CRM dashboard
  - [ ] Verify "Total Clicked" increased
  - [ ] Click rate percentage updated

- [ ] **Reply Tracking**
  - [ ] Reply to the LOI email
  - [ ] Write a test response
  - [ ] Send the reply
  - [ ] Wait 1 minute for webhook processing
  - [ ] Refresh CRM dashboard
  - [ ] Verify "Total Replied" increased
  - [ ] Reply rate percentage updated

---

## Webhook Integration

### ✅ Resend Webhook Configuration

- [ ] **Webhook Endpoint Set Up**
  - [ ] Webhook URL: `https://your-domain.vercel.app/api/webhooks/resend`
  - [ ] Webhook is active in Resend dashboard
  - [ ] Events subscribed:
    - [ ] `email.sent`
    - [ ] `email.delivered`
    - [ ] `email.delivery_delayed`
    - [ ] `email.complained`
    - [ ] `email.bounced`
    - [ ] `email.opened`
    - [ ] `email.clicked`

- [ ] **Webhook Event Processing**
  - [ ] Send a test email
  - [ ] Check Supabase `email_events` table
  - [ ] Verify `email.sent` event recorded
  - [ ] Verify `email.delivered` event recorded
  - [ ] Open the email
  - [ ] Verify `email.opened` event recorded
  - [ ] Click a link (if available)
  - [ ] Verify `email.clicked` event recorded

- [ ] **Database Updates from Webhooks**
  - [ ] Check `loi_emails` table
  - [ ] Verify `status` updated to 'delivered'
  - [ ] Verify `delivered_at` timestamp set
  - [ ] Verify `opened` = true after opening
  - [ ] Verify `opened_at` timestamp set
  - [ ] Verify `open_count` incremented
  - [ ] Verify `clicked` = true after clicking
  - [ ] Verify `click_count` incremented

---

## CRM Dashboard

### ✅ Navigation & Access

- [ ] **Access CRM Dashboard**
  - [ ] Click "CRM Dashboard" button from calculator
  - [ ] URL changes to `/crm`
  - [ ] Page loads successfully
  - [ ] No console errors

- [ ] **Dashboard Header**
  - [ ] "CRM Dashboard" title visible
  - [ ] Users icon displayed
  - [ ] Subtitle: "Track agent performance and email analytics"
  - [ ] "Calculator" button (back link)
  - [ ] "Analytics" button (green)
  - [ ] All buttons have icons

### ✅ Summary Statistics

- [ ] **Four Summary Cards Displayed**
  - [ ] **Total Agents Card**
    - [ ] Shows count: 24
    - [ ] Users icon visible
    - [ ] Green accent icon
  - [ ] **Total Emails Card**
    - [ ] Shows number of emails sent
    - [ ] Mail icon visible
    - [ ] Number matches database count
  - [ ] **Total Replies Card**
    - [ ] Shows number of replies
    - [ ] Message Square icon
    - [ ] Number matches test replies sent
  - [ ] **Avg Reply Rate Card**
    - [ ] Shows percentage
    - [ ] Trending Up icon
    - [ ] Green text color
    - [ ] Calculation looks correct

### ✅ Time Range Selector

- [ ] **Time Range Controls Visible**
  - [ ] Calendar icon shown
  - [ ] "Time Range:" label
  - [ ] Five buttons displayed:
    - [ ] Last Week
    - [ ] Last Month (default selected, green)
    - [ ] Last Quarter
    - [ ] Last Year
    - [ ] All Time

- [ ] **Time Range Functionality**
  - [ ] Click "Last Week"
  - [ ] Button turns green
  - [ ] Page reloads data
  - [ ] Summary stats update
  - [ ] Table data filters to last 7 days
  - [ ] Click "Last Month"
  - [ ] Data updates to 30 days
  - [ ] Click "Last Quarter"
  - [ ] Data updates to 90 days
  - [ ] Click "Last Year"
  - [ ] Data updates to 365 days
  - [ ] Click "All Time"
  - [ ] Shows all historical data

### ✅ Search & Filter

- [ ] **Search Bar**
  - [ ] Search input visible
  - [ ] Search icon on left
  - [ ] Placeholder text clear
  - [ ] Type agent name (e.g., "Ammar")
  - [ ] Table filters to matching agents
  - [ ] Clear search
  - [ ] All agents reappear
  - [ ] Search by email
  - [ ] Filters correctly
  - [ ] Partial search works

- [ ] **Refresh Button**
  - [ ] "Refresh Data" button visible
  - [ ] Click button
  - [ ] Loading state shows
  - [ ] Data reloads
  - [ ] Latest data displayed

### ✅ Agents Table

- [ ] **Table Structure**
  - [ ] Table headers visible:
    - [ ] Agent (sortable)
    - [ ] Sent (sortable)
    - [ ] Opened
    - [ ] Replied
    - [ ] Reply Rate (sortable)
    - [ ] Last 30d
    - [ ] Last Active
    - [ ] Actions
  - [ ] All 24 agents listed
  - [ ] Table is responsive

- [ ] **Agent Data Display**
  - [ ] Each row shows:
    - [ ] Agent avatar (circle with initial)
    - [ ] Agent name
    - [ ] Agent email
    - [ ] Total emails sent
    - [ ] Total opened (with percentage)
    - [ ] Total replied (with percentage)
    - [ ] Reply rate badge (green)
    - [ ] 30-day stats
    - [ ] Last activity time
    - [ ] "View" button

- [ ] **Sorting Functionality**
  - [ ] Click "Agent" header
  - [ ] Sorts alphabetically A-Z
  - [ ] Click again
  - [ ] Sorts Z-A
  - [ ] Click "Sent" header
  - [ ] Sorts by email count descending
  - [ ] Click again
  - [ ] Sorts ascending
  - [ ] Click "Reply Rate" header
  - [ ] Sorts by highest reply rate first
  - [ ] Default sort maintained

- [ ] **Hover States**
  - [ ] Hover over table row
  - [ ] Background changes (highlight)
  - [ ] Smooth transition

- [ ] **View Agent Details**
  - [ ] Click "View" button for an agent
  - [ ] Navigates to agent detail page
  - [ ] URL: `/crm/agents/[id]`

### ✅ Empty States

- [ ] **No Search Results**
  - [ ] Search for non-existent agent: "ZZZZZ"
  - [ ] Empty state message shows
  - [ ] "No agents found matching your search"
  - [ ] Icon displayed
  - [ ] Clear search to restore

---

## CRM Analytics

### ✅ Analytics Page Access

- [ ] **Navigate to Analytics**
  - [ ] From CRM dashboard, click "Analytics" button
  - [ ] URL changes to `/crm/analytics`
  - [ ] Page loads successfully
  - [ ] No console errors

- [ ] **Analytics Header**
  - [ ] "Analytics" title visible
  - [ ] Bar Chart icon
  - [ ] Subtitle: "Insights and performance metrics"
  - [ ] "Back to CRM" button visible

### ✅ Time Range Selector

- [ ] **Time Controls Present**
  - [ ] Calendar icon
  - [ ] "Time Range:" label
  - [ ] Five buttons:
    - [ ] Last Week
    - [ ] Last Month (default)
    - [ ] Last Quarter
    - [ ] Last Year
    - [ ] All Time

- [ ] **Time Range Switching**
  - [ ] Click each time range button
  - [ ] Active button turns green
  - [ ] Data updates for each range
  - [ ] Loading state shows during update
  - [ ] All sections update simultaneously

### ✅ Performance by Offer Type

- [ ] **Section Visible**
  - [ ] "Performance by Offer Type" heading
  - [ ] Cards for each offer type sent
  - [ ] Typically 3 cards:
    - [ ] Max Owner Favored
    - [ ] Balanced
    - [ ] Max Buyer Favored

- [ ] **Offer Type Cards**
  - [ ] Each card shows:
    - [ ] Offer type name
    - [ ] Sent count
    - [ ] Opened count with percentage
    - [ ] Replied count with percentage (green)
    - [ ] Average Price
    - [ ] Average Down Payment
    - [ ] Average Monthly Payment
  - [ ] Numbers match sent LOIs
  - [ ] Percentages calculated correctly

- [ ] **Empty State**
  - [ ] If no data: "No offer type data available"
  - [ ] Trending Up icon
  - [ ] Clear message

### ✅ Top Performing Agents

- [ ] **Section Visible**
  - [ ] "Top Performing Agents" heading
  - [ ] Table displayed
  - [ ] Headers: Rank, Agent, Sent, Opened, Replied, Reply Rate

- [ ] **Agent Rankings**
  - [ ] Agents listed by reply rate
  - [ ] Rank badges shown (1, 2, 3, etc.)
  - [ ] Top 3 have special green badges:
    - [ ] #1: Brightest green
    - [ ] #2: Medium green
    - [ ] #3: Light green
  - [ ] Agent avatars with initials
  - [ ] Agent names
  - [ ] Metrics displayed
  - [ ] Reply rate badges (green)

- [ ] **Data Accuracy**
  - [ ] Rankings correct based on reply rate
  - [ ] Ties handled properly
  - [ ] Agents with 0 sent at bottom

### ✅ Recent Activity Table

- [ ] **Section Visible**
  - [ ] "Recent Activity (Last 7 Days)" heading
  - [ ] Table with daily breakdown
  - [ ] Headers: Date, Emails Sent, Opened, Replied, Active Agents

- [ ] **Daily Data Rows**
  - [ ] Up to 7 days shown (or less if newer system)
  - [ ] Each row shows:
    - [ ] Date (formatted: "Jan 15")
    - [ ] Calendar icon
    - [ ] Emails sent count with Mail icon
    - [ ] Opened count with Eye icon
    - [ ] Replied count with Message icon (green)
    - [ ] Active agents count with Users icon
  - [ ] Dates in descending order (newest first)

- [ ] **Time Range Impact**
  - [ ] Change time range to "Last Month"
  - [ ] Table title updates: "Recent Activity (Last 30 Days)"
  - [ ] More days displayed
  - [ ] Change to "Last Year"
  - [ ] Shows appropriate date range

---

## Agent Detail Pages

### ✅ Navigation to Agent Details

- [ ] **Access Agent Page**
  - [ ] From CRM dashboard, click "View" for Agent #1 (Ammar)
  - [ ] URL: `/crm/agents/1`
  - [ ] Page loads successfully
  - [ ] "Back to Agents" button visible

### ✅ Agent Header

- [ ] **Agent Info Card**
  - [ ] Large avatar circle with initial
  - [ ] Green accent background on avatar
  - [ ] Agent name displayed large
  - [ ] Email shown with Mail icon (green)
  - [ ] Phone shown with Phone icon (green)
  - [ ] Professional layout

### ✅ All-Time Performance Section

- [ ] **Section Heading**
  - [ ] "All-Time Performance" title
  - [ ] Four stat cards below

- [ ] **Performance Cards**
  - [ ] **Total Sent Card**
    - [ ] Number of emails sent
    - [ ] Mail icon (green accent)
  - [ ] **Total Opened Card**
    - [ ] Number opened
    - [ ] Eye icon
    - [ ] Open rate percentage shown
  - [ ] **Total Replied Card**
    - [ ] Number replied
    - [ ] Message Square icon
    - [ ] Reply rate in green
  - [ ] **Avg Response Time Card**
    - [ ] Hours to reply
    - [ ] Clock icon
    - [ ] "hours" label
    - [ ] Shows "N/A" if no replies

### ✅ Last 30 Days Section

- [ ] **Section Heading**
  - [ ] "Last 30 Days" title
  - [ ] Four stat cards

- [ ] **30-Day Stats Cards**
  - [ ] Emails Sent (30 days)
  - [ ] Opened (30 days)
  - [ ] Replied (30 days)
  - [ ] Reply Rate (green percentage)
  - [ ] Numbers match filtered data

### ✅ Email History Table

- [ ] **Section Heading**
  - [ ] "Email History" title
  - [ ] Table displayed below

- [ ] **Table Structure**
  - [ ] Headers visible:
    - [ ] Property
    - [ ] Offer Type
    - [ ] Price
    - [ ] Status
    - [ ] Engagement
    - [ ] Sent
  - [ ] Dark header background
  - [ ] Green accent headers

- [ ] **Email Rows**
  - [ ] Each email shows:
    - [ ] Property address
    - [ ] Reply from email (if replied)
    - [ ] Offer type
    - [ ] Offer price (formatted currency)
    - [ ] Status icon:
      - [ ] Green checkmark if replied
      - [ ] Blue eye if opened
      - [ ] Gray circle if only sent
    - [ ] Status text
    - [ ] Open count
    - [ ] Click count (if > 0)
    - [ ] Relative time ("2h ago", "3d ago")
  - [ ] Up to 20 emails shown
  - [ ] Most recent first

- [ ] **Hover States**
  - [ ] Hover over email row
  - [ ] Background highlights
  - [ ] Smooth transition

- [ ] **Empty State**
  - [ ] If agent has no emails:
  - [ ] "No emails sent yet" message
  - [ ] Mail icon (large, faded)

### ✅ Recent Replies Section

- [ ] **Section Display**
  - [ ] Only visible if agent has replies
  - [ ] "Recent Replies (X)" heading with count
  - [ ] Up to 5 most recent replies shown

- [ ] **Reply Cards**
  - [ ] Each reply shows:
    - [ ] Subject line
    - [ ] From email address
    - [ ] Received date/time
    - [ ] Text content in scrollable box
    - [ ] Dark background for content
    - [ ] "(No text content)" if empty
  - [ ] Cards have shadow and border
  - [ ] Professional layout

---

## Time Range Filtering

### ✅ CRM Dashboard Time Ranges

- [ ] **Week Filter**
  - [ ] Select "Last Week"
  - [ ] Summary stats update
  - [ ] Table shows only last 7 days data
  - [ ] Verify dates in "Last Active" column
  - [ ] API response includes: `"daysBack": 7`

- [ ] **Month Filter**
  - [ ] Select "Last Month"
  - [ ] Shows 30 days of data
  - [ ] Default selection
  - [ ] API response includes: `"daysBack": 30`

- [ ] **Quarter Filter**
  - [ ] Select "Last Quarter"
  - [ ] Shows 90 days of data
  - [ ] More agents may show activity
  - [ ] API response includes: `"daysBack": 90`

- [ ] **Year Filter**
  - [ ] Select "Last Year"
  - [ ] Shows 365 days of data
  - [ ] All yearly activity visible
  - [ ] API response includes: `"daysBack": 365`

- [ ] **All Time**
  - [ ] Select "All Time"
  - [ ] Shows complete history
  - [ ] Uses optimized database views
  - [ ] API response includes: `"daysBack": 999999`

### ✅ Analytics Page Time Ranges

- [ ] **Test All Ranges**
  - [ ] Select "Last Week"
  - [ ] All three sections update:
    - [ ] Offer Type Performance
    - [ ] Top Performing Agents
    - [ ] Recent Activity
  - [ ] Data filters to 7 days
  - [ ] Repeat for Month, Quarter, Year, All Time
  - [ ] Verify each updates all sections

- [ ] **Data Consistency**
  - [ ] Compare "Last Month" on both pages
  - [ ] Agent stats should match
  - [ ] Reply rates should match
  - [ ] Email counts should match

---

## Database Verification

### ✅ Supabase Table Checks

- [ ] **loi_emails Table**
  - [ ] Open Supabase dashboard
  - [ ] Navigate to Table Editor
  - [ ] Open `loi_emails` table
  - [ ] Verify records exist for sent emails
  - [ ] Check fields:
    - [ ] `tracking_id` is unique
    - [ ] `agent_id` matches selected agent
    - [ ] `status` is 'delivered' or 'sent'
    - [ ] `sent_at` timestamp is correct
    - [ ] `opened` updated after email opened
    - [ ] `open_count` > 0 after opening
    - [ ] `replied` = true after reply
    - [ ] `replied_at` timestamp set

- [ ] **email_events Table**
  - [ ] Open `email_events` table
  - [ ] Verify webhook events recorded
  - [ ] Events for each sent email:
    - [ ] `email.sent`
    - [ ] `email.delivered`
    - [ ] `email.opened` (if opened)
    - [ ] `email.clicked` (if clicked)
  - [ ] `event_data` JSONB has details
  - [ ] Timestamps correct

- [ ] **email_replies Table**
  - [ ] Open `email_replies` table
  - [ ] Verify reply records
  - [ ] Check if reply sent:
    - [ ] `loi_tracking_id` matches email
    - [ ] `from_email` is realtor
    - [ ] `to_email` is agent
    - [ ] `text_content` or `html_content` present
    - [ ] `received_at` timestamp correct

### ✅ Analytics Views

- [ ] **agent_performance_summary**
  - [ ] Run query: `SELECT * FROM agent_performance_summary WHERE agent_id = 1;`
  - [ ] Verify stats calculated correctly
  - [ ] `total_sent` matches emails sent
  - [ ] `total_opened` matches
  - [ ] `total_replied` matches
  - [ ] Rates calculated correctly

- [ ] **agent_activity_30d**
  - [ ] Run query: `SELECT * FROM agent_activity_30d WHERE agent_id = 1;`
  - [ ] Verify 30-day stats
  - [ ] Only counts last 30 days

- [ ] **offer_type_analytics**
  - [ ] Run query: `SELECT * FROM offer_type_analytics;`
  - [ ] Shows all offer types sent
  - [ ] Averages calculated correctly

- [ ] **daily_email_volume**
  - [ ] Run query: `SELECT * FROM daily_email_volume ORDER BY date DESC LIMIT 7;`
  - [ ] Shows daily breakdown
  - [ ] Counts match sent emails

### ✅ Database Functions

- [ ] **get_agent_activity_by_range**
  - [ ] Run: `SELECT * FROM get_agent_activity_by_range(7);`
  - [ ] Returns data for last 7 days
  - [ ] Run: `SELECT * FROM get_agent_activity_by_range(30);`
  - [ ] Returns different data for 30 days
  - [ ] Verify counts correct

- [ ] **get_offer_type_analytics_by_range**
  - [ ] Run: `SELECT * FROM get_offer_type_analytics_by_range(7);`
  - [ ] Returns offer type stats for range
  - [ ] Test multiple time ranges

- [ ] **get_top_agents_by_range**
  - [ ] Run: `SELECT * FROM get_top_agents_by_range(5, 30);`
  - [ ] Returns top 5 agents for 30 days
  - [ ] Sorted by reply_rate DESC

---

## Performance Testing

### ✅ Page Load Speed

- [ ] **Dashboard Load Time**
  - [ ] Open browser DevTools (F12)
  - [ ] Navigate to Network tab
  - [ ] Clear cache
  - [ ] Load `/crm` page
  - [ ] Verify load time < 2 seconds
  - [ ] Check API response time:
    - [ ] `/api/crm/agents` < 500ms

- [ ] **Analytics Load Time**
  - [ ] Navigate to `/crm/analytics`
  - [ ] Verify load time < 2 seconds
  - [ ] Check API response time:
    - [ ] `/api/crm/analytics` < 500ms

- [ ] **Agent Detail Load Time**
  - [ ] Navigate to `/crm/agents/1`
  - [ ] Verify load time < 2 seconds
  - [ ] Check API response time:
    - [ ] `/api/crm/agents/1` < 500ms

### ✅ Time Range Switching Speed

- [ ] **Switch Time Ranges**
  - [ ] On CRM dashboard
  - [ ] Click different time ranges
  - [ ] Each switch should take < 1 second
  - [ ] No lag or freezing
  - [ ] Smooth transitions

### ✅ Large Data Handling

- [ ] **Send Multiple Emails**
  - [ ] Send 10+ LOI emails
  - [ ] Verify dashboard still loads fast
  - [ ] Table renders all rows
  - [ ] Sorting still works quickly
  - [ ] Search filters quickly

---

## Error Handling

### ✅ Network Errors

- [ ] **API Endpoint Failures**
  - [ ] Stop the backend server
  - [ ] Try to load CRM dashboard
  - [ ] Error message displays
  - [ ] "Failed to fetch agents" or similar
  - [ ] No white screen of death
  - [ ] Restart server
  - [ ] Refresh page
  - [ ] Works again

### ✅ Invalid Data

- [ ] **Invalid Agent ID**
  - [ ] Navigate to `/crm/agents/999`
  - [ ] Error message displays
  - [ ] "Agent not found"
  - [ ] "Back to CRM" button available
  - [ ] Click back button
  - [ ] Returns to dashboard

- [ ] **Invalid Time Range**
  - [ ] Try URL: `/api/crm/agents?range=invalid`
  - [ ] Should default to "month" (30 days)
  - [ ] No crash or error

### ✅ Email Sending Errors

- [ ] **Invalid Resend API Key**
  - [ ] Temporarily set wrong `RESEND_API_KEY`
  - [ ] Try to send LOI
  - [ ] Error message displays
  - [ ] "Failed to send email" or similar
  - [ ] User can try again
  - [ ] Restore correct API key

- [ ] **Missing Required Fields**
  - [ ] Try to send LOI with empty email
  - [ ] Validation error shows
  - [ ] Field highlighted in red
  - [ ] Cannot submit until fixed

### ✅ Database Errors

- [ ] **Supabase Connection Lost**
  - [ ] Temporarily use wrong Supabase URL
  - [ ] Try to load CRM
  - [ ] Error handling graceful
  - [ ] Error message clear
  - [ ] Restore correct URL

---

## Final Verification

### ✅ Cross-Browser Testing

- [ ] **Chrome**
  - [ ] Full functionality works
  - [ ] No console errors
  - [ ] UI looks correct

- [ ] **Firefox**
  - [ ] Full functionality works
  - [ ] No console errors
  - [ ] UI looks correct

- [ ] **Safari** (if on Mac)
  - [ ] Full functionality works
  - [ ] No console errors
  - [ ] UI looks correct

- [ ] **Edge**
  - [ ] Full functionality works
  - [ ] No console errors
  - [ ] UI looks correct

### ✅ Responsive Design

- [ ] **Mobile View (375px)**
  - [ ] Open DevTools
  - [ ] Toggle device toolbar
  - [ ] Select iPhone SE (375px)
  - [ ] Navigate through CRM
  - [ ] All elements visible
  - [ ] No horizontal scroll
  - [ ] Buttons clickable
  - [ ] Tables scroll horizontally

- [ ] **Tablet View (768px)**
  - [ ] Select iPad (768px)
  - [ ] Layout adjusts properly
  - [ ] All features accessible
  - [ ] Navigation works

- [ ] **Desktop View (1920px)**
  - [ ] Select responsive mode 1920px
  - [ ] Layout uses full width
  - [ ] No weird spacing
  - [ ] Looks professional

### ✅ Production Readiness

- [ ] **Environment Variables**
  - [ ] All production keys set in Vercel
  - [ ] No hardcoded secrets in code
  - [ ] `.env.example` file exists

- [ ] **Build Success**
  - [ ] Run `npm run build`
  - [ ] Build completes without errors
  - [ ] No TypeScript errors
  - [ ] No linting errors

- [ ] **Deployment**
  - [ ] Push to main branch
  - [ ] Vercel auto-deploys
  - [ ] Check deployment logs
  - [ ] No errors in build
  - [ ] Visit production URL
  - [ ] Everything works

---

## 🎯 Testing Summary

**Total Checklist Items:** 400+

**Test Categories:**
- ✅ Pre-Testing Setup: 15 items
- ✅ Calculator & LOI: 80 items
- ✅ Email Sending: 40 items
- ✅ Webhooks: 20 items
- ✅ CRM Dashboard: 75 items
- ✅ Analytics: 50 items
- ✅ Agent Details: 45 items
- ✅ Time Ranges: 30 items
- ✅ Database: 40 items
- ✅ Performance: 15 items
- ✅ Error Handling: 25 items
- ✅ Final Verification: 30 items

---

## 📝 Test Results Template

Copy this template to track your testing:

```
=================================
MIANA CRM TESTING RESULTS
=================================
Date: _______________
Tester: _____________

OVERALL STATUS: [ ] PASS  [ ] FAIL

SECTIONS TESTED:
[ ] Pre-Testing Setup
[ ] Calculator & LOI Generation
[ ] Email Sending & Tracking
[ ] Webhook Integration
[ ] CRM Dashboard
[ ] CRM Analytics
[ ] Agent Detail Pages
[ ] Time Range Filtering
[ ] Database Verification
[ ] Performance Testing
[ ] Error Handling
[ ] Final Verification

CRITICAL BUGS FOUND:
1. ______________________________
2. ______________________________
3. ______________________________

MINOR ISSUES:
1. ______________________________
2. ______________________________

NOTES:
_________________________________
_________________________________
_________________________________
```

---

## 🆘 Troubleshooting Guide

If tests fail, check these common issues:

1. **Database migration not run** → Run all SQL migrations in Supabase
2. **Environment variables missing** → Check `.env.local` file
3. **API keys invalid** → Verify Resend and RentCast keys
4. **Webhook not configured** → Set up Resend webhook
5. **Port already in use** → Kill process on port 3000
6. **Build errors** → Run `npm install` and `npm run build`
7. **Supabase RLS blocking** → Ensure using service role key
8. **Time zone issues** → Check server timezone settings
9. **Cache issues** → Clear browser cache, hard refresh
10. **Node version** → Ensure Node.js 18+ installed

---

**Good luck with testing! 🚀**

Check off each item as you complete it. Report any failures immediately.
