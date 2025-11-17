#!/usr/bin/env node

// =====================================================
// Pipeline API Test Script
// Run with: node scripts/test-pipeline-api.mjs
// =====================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/crm/pipeline`;

let createdDealId = null;

// Helper to make API calls
async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`\n${method} ${url}`);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
    console.log('Body:', JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Test 1: Create a New Deal
// =====================================================
async function test1_createDeal() {
  console.log('\n\n========================================');
  console.log('TEST 1: Create New Deal');
  console.log('========================================');

  const dealData = {
    property_address: '456 Market St, Indianapolis, IN 46204',
    opportunity_value: 275000,
    agent_id: 1,
    agent_name: 'Ammar',
    agent_email: 'ammar@miana.com.co',
    offer_price: 265000,
    down_payment: 0,
    monthly_payment: 1650,
    balloon_period: 20,
    estimated_rehab_cost: 15000,
    expected_closing_date: '2025-04-15',
    realtor_name: 'Jane Smith',
    realtor_email: 'jane@realty.com',
    priority: 'high',
    notes: 'Motivated seller, good condition',
    created_by: 'api_test',
  };

  const result = await apiCall('POST', '/deals', dealData);

  if (result.success && result.data.deal) {
    createdDealId = result.data.deal.id;
    console.log(`\n✅ Deal created successfully! ID: ${createdDealId}`);
  } else {
    console.log('\n❌ Failed to create deal');
  }

  return result.success;
}

// =====================================================
// Test 2: List All Deals
// =====================================================
async function test2_listDeals() {
  console.log('\n\n========================================');
  console.log('TEST 2: List All Active Deals');
  console.log('========================================');

  const result = await apiCall('GET', '/deals?status=active');

  if (result.success) {
    console.log(`\n✅ Found ${result.data.total} active deals`);
  } else {
    console.log('\n❌ Failed to list deals');
  }

  return result.success;
}

// =====================================================
// Test 3: Get Single Deal
// =====================================================
async function test3_getSingleDeal() {
  console.log('\n\n========================================');
  console.log('TEST 3: Get Single Deal');
  console.log('========================================');

  if (!createdDealId) {
    console.log('❌ No deal ID available (create a deal first)');
    return false;
  }

  const result = await apiCall('GET', `/deals/${createdDealId}`);

  if (result.success) {
    console.log(`\n✅ Deal retrieved successfully`);
    console.log(`   Stage: ${result.data.deal.stage}`);
    console.log(`   Status: ${result.data.deal.status}`);
    console.log(`   Stage History: ${result.data.stageHistory.length} entries`);
    console.log(`   Activities: ${result.data.activities.length} entries`);
  } else {
    console.log('\n❌ Failed to get deal');
  }

  return result.success;
}

// =====================================================
// Test 4: Update Deal
// =====================================================
async function test4_updateDeal() {
  console.log('\n\n========================================');
  console.log('TEST 4: Update Deal');
  console.log('========================================');

  if (!createdDealId) {
    console.log('❌ No deal ID available');
    return false;
  }

  const updates = {
    opportunity_value: 280000,
    notes: 'Updated notes - seller agreed to include appliances',
    priority: 'urgent',
    updated_by: 'api_test',
  };

  const result = await apiCall('PATCH', `/deals/${createdDealId}`, updates);

  if (result.success) {
    console.log(`\n✅ Deal updated successfully`);
    console.log(`   New opportunity value: $${result.data.deal.opportunity_value}`);
  } else {
    console.log('\n❌ Failed to update deal');
  }

  return result.success;
}

// =====================================================
// Test 5: Move Deal to Due Diligence
// =====================================================
async function test5_moveToDueDiligence() {
  console.log('\n\n========================================');
  console.log('TEST 5: Move Deal to Due Diligence');
  console.log('========================================');

  if (!createdDealId) {
    console.log('❌ No deal ID available');
    return false;
  }

  const moveData = {
    new_stage: 'due_diligence',
    changed_by: 'api_test',
    notes: 'Inspection scheduled for next week',
  };

  const result = await apiCall('POST', `/deals/${createdDealId}/move`, moveData);

  if (result.success) {
    console.log(`\n✅ Deal moved successfully`);
    console.log(`   From: ${result.data.transition.from}`);
    console.log(`   To: ${result.data.transition.to}`);
    console.log(`   Probability: ${result.data.deal.probability_to_close}%`);
  } else {
    console.log('\n❌ Failed to move deal');
  }

  return result.success;
}

// =====================================================
// Test 6: Create Activity
// =====================================================
async function test6_createActivity() {
  console.log('\n\n========================================');
  console.log('TEST 6: Create Activity');
  console.log('========================================');

  if (!createdDealId) {
    console.log('❌ No deal ID available');
    return false;
  }

  const activityData = {
    activity_type: 'inspection',
    title: 'Home inspection completed',
    description: 'Inspector found minor issues with HVAC. Est repair cost $3,500.',
    contact_name: 'Mike Johnson (Inspector)',
    contact_email: 'mike@inspections.com',
    outcome: 'neutral',
    created_by: 'api_test',
  };

  const result = await apiCall('POST', `/deals/${createdDealId}/activities`, activityData);

  if (result.success) {
    console.log(`\n✅ Activity created successfully`);
    console.log(`   Type: ${result.data.activity.activity_type}`);
    console.log(`   Outcome: ${result.data.activity.outcome}`);
  } else {
    console.log('\n❌ Failed to create activity');
  }

  return result.success;
}

// =====================================================
// Test 7: Get Activities
// =====================================================
async function test7_getActivities() {
  console.log('\n\n========================================');
  console.log('TEST 7: Get Activities');
  console.log('========================================');

  if (!createdDealId) {
    console.log('❌ No deal ID available');
    return false;
  }

  const result = await apiCall('GET', `/deals/${createdDealId}/activities`);

  if (result.success) {
    console.log(`\n✅ Found ${result.data.total} activities`);
    result.data.activities.forEach((activity, i) => {
      console.log(`   ${i + 1}. ${activity.title} (${activity.activity_type})`);
    });
  } else {
    console.log('\n❌ Failed to get activities');
  }

  return result.success;
}

// =====================================================
// Test 8: Get Analytics Summary
// =====================================================
async function test8_getAnalyticsSummary() {
  console.log('\n\n========================================');
  console.log('TEST 8: Get Analytics Summary');
  console.log('========================================');

  const result = await apiCall('GET', '/analytics/summary?days_back=30');

  if (result.success) {
    const summary = result.data.summary;
    console.log(`\n✅ Analytics retrieved successfully`);
    console.log('\n   All-Time Metrics:');
    console.log(`   - Active Deals: ${summary.allTime.total_active_deals}`);
    console.log(`   - Won Deals: ${summary.allTime.total_won_deals}`);
    console.log(`   - Active Pipeline Value: $${summary.allTime.active_pipeline_value?.toLocaleString() || 0}`);
    console.log(`   - Conversion Rate: ${summary.allTime.overall_conversion_rate || 0}%`);

    console.log('\n   By Stage:');
    summary.byStage.forEach(stage => {
      console.log(`   - ${stage.stage}: ${stage.deal_count} deals ($${stage.total_value?.toLocaleString() || 0})`);
    });
  } else {
    console.log('\n❌ Failed to get analytics');
  }

  return result.success;
}

// =====================================================
// Test 9: Get Agent Performance
// =====================================================
async function test9_getAgentPerformance() {
  console.log('\n\n========================================');
  console.log('TEST 9: Get Agent Performance');
  console.log('========================================');

  const result = await apiCall('GET', '/analytics/agents');

  if (result.success) {
    console.log(`\n✅ Found performance data for ${result.data.total} agents`);

    const topAgents = result.data.agents.slice(0, 5);
    console.log('\n   Top 5 Agents by Won Value:');
    topAgents.forEach((agent, i) => {
      console.log(`   ${i + 1}. ${agent.agent_name}`);
      console.log(`      Active: ${agent.active_deals}, Won: ${agent.won_deals}`);
      console.log(`      Won Value: $${agent.total_won_value?.toLocaleString() || 0}`);
      console.log(`      Conversion Rate: ${agent.conversion_rate || 0}%`);
    });
  } else {
    console.log('\n❌ Failed to get agent performance');
  }

  return result.success;
}

// =====================================================
// Test 10: Get Forecast
// =====================================================
async function test10_getForecast() {
  console.log('\n\n========================================');
  console.log('TEST 10: Get Pipeline Forecast');
  console.log('========================================');

  const result = await apiCall('GET', '/analytics/forecast?months_ahead=6');

  if (result.success) {
    console.log(`\n✅ Forecast retrieved successfully`);
    console.log(`\n   Summary:`);
    console.log(`   - Total Expected Closings: ${result.data.summary.total_expected_closings}`);
    console.log(`   - Total Expected Value: $${result.data.summary.total_expected_value?.toLocaleString() || 0}`);
    console.log(`   - Weighted Value: $${result.data.summary.total_weighted_value?.toLocaleString() || 0}`);

    if (result.data.forecast.length > 0) {
      console.log(`\n   By Month:`);
      result.data.forecast.forEach(month => {
        console.log(`   - ${month.closing_month}: ${month.expected_closings} closings ($${month.expected_value?.toLocaleString() || 0})`);
      });
    }
  } else {
    console.log('\n❌ Failed to get forecast');
  }

  return result.success;
}

// =====================================================
// Test 11: Error Cases
// =====================================================
async function test11_errorCases() {
  console.log('\n\n========================================');
  console.log('TEST 11: Error Handling');
  console.log('========================================');

  // Test invalid opportunity value
  console.log('\n--- Test: Invalid opportunity_value (should fail) ---');
  const invalidDeal = await apiCall('POST', '/deals', {
    property_address: '123 Test St',
    opportunity_value: -100,
    agent_id: 1,
    agent_name: 'Test',
    agent_email: 'test@test.com',
  });

  if (!invalidDeal.success && invalidDeal.status === 400) {
    console.log('✅ Correctly rejected invalid opportunity value');
  }

  // Test invalid agent ID
  console.log('\n--- Test: Invalid agent_id (should fail) ---');
  const invalidAgent = await apiCall('POST', '/deals', {
    property_address: '123 Test St',
    opportunity_value: 100000,
    agent_id: 99,
    agent_name: 'Test',
    agent_email: 'test@test.com',
  });

  if (!invalidAgent.success && invalidAgent.status === 400) {
    console.log('✅ Correctly rejected invalid agent ID');
  }

  // Test non-existent deal
  console.log('\n--- Test: Non-existent deal (should fail) ---');
  const nonExistent = await apiCall('GET', '/deals/00000000-0000-0000-0000-000000000000');

  if (!nonExistent.success && nonExistent.status === 404) {
    console.log('✅ Correctly returned 404 for non-existent deal');
  }

  return true;
}

// =====================================================
// Run All Tests
// =====================================================
async function runAllTests() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   PIPELINE API TEST SUITE                ║');
  console.log('╚══════════════════════════════════════════╝');

  const tests = [
    { name: 'Create Deal', fn: test1_createDeal },
    { name: 'List Deals', fn: test2_listDeals },
    { name: 'Get Single Deal', fn: test3_getSingleDeal },
    { name: 'Update Deal', fn: test4_updateDeal },
    { name: 'Move to Due Diligence', fn: test5_moveToDueDiligence },
    { name: 'Create Activity', fn: test6_createActivity },
    { name: 'Get Activities', fn: test7_getActivities },
    { name: 'Analytics Summary', fn: test8_getAnalyticsSummary },
    { name: 'Agent Performance', fn: test9_getAgentPerformance },
    { name: 'Pipeline Forecast', fn: test10_getForecast },
    { name: 'Error Handling', fn: test11_errorCases },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`\n❌ Test "${test.name}" threw an error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((result, i) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${i + 1}. ${result.name}`);
  });

  console.log('');
  console.log(`Total: ${passed}/${total} tests passed`);

  if (createdDealId) {
    console.log(`\nCreated Deal ID: ${createdDealId}`);
    console.log('(You can use this ID for manual testing)');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(console.error);
