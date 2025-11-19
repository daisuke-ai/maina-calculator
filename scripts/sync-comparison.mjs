#!/usr/bin/env node
/**
 * Compare sync strategies for different call volumes
 */

console.log('📊 Call Sync Strategy Comparison\n');
console.log('='.repeat(60));

const scenarios = [
  { calls_per_day: 100, label: 'Small Agency' },
  { calls_per_day: 1000, label: 'Medium Agency' },
  { calls_per_day: 5000, label: 'Large Agency' },
  { calls_per_day: 10000, label: 'Enterprise' },
  { calls_per_day: 50000, label: 'Call Center' },
];

console.log('\n🔴 CURRENT APPROACH (Full Sync Every 6 Hours):');
console.log('-'.repeat(60));

scenarios.forEach(({ calls_per_day, label }) => {
  const sync_window_days = 7;
  const syncs_per_day = 4; // Every 6 hours
  const records_per_sync = calls_per_day * sync_window_days;
  const total_processed_daily = records_per_sync * syncs_per_day;
  const redundancy_rate = ((total_processed_daily - calls_per_day) / total_processed_daily * 100).toFixed(1);

  // Check if it breaks
  const max_records_per_sync = 10000; // Current limit (10 pages × 1000)
  const breaks = records_per_sync > max_records_per_sync;

  console.log(`\n${label} (${calls_per_day.toLocaleString()} calls/day):`);
  if (breaks) {
    console.log(`  ❌ BREAKS! Needs ${records_per_sync.toLocaleString()} records/sync (max: ${max_records_per_sync.toLocaleString()})`);
  } else {
    console.log(`  • Records per sync: ${records_per_sync.toLocaleString()}`);
    console.log(`  • Daily processing: ${total_processed_daily.toLocaleString()} records`);
    console.log(`  • Redundancy: ${redundancy_rate}% wasted`);
    console.log(`  • Estimated time: ${(records_per_sync * 0.002).toFixed(1)}s per sync`);
  }
});

console.log('\n\n🟢 NEW APPROACH (Incremental Hourly Sync):');
console.log('-'.repeat(60));

scenarios.forEach(({ calls_per_day, label }) => {
  // Determine sync frequency based on volume
  let sync_frequency_minutes;
  if (calls_per_day <= 1000) {
    sync_frequency_minutes = 360; // Every 6 hours (keep current for low volume)
  } else if (calls_per_day <= 5000) {
    sync_frequency_minutes = 60; // Every hour
  } else if (calls_per_day <= 10000) {
    sync_frequency_minutes = 30; // Every 30 minutes
  } else {
    sync_frequency_minutes = 15; // Every 15 minutes
  }

  const syncs_per_day = (24 * 60) / sync_frequency_minutes;
  const calls_per_sync = Math.ceil(calls_per_day / syncs_per_day);
  const buffer_multiplier = 1.2; // 20% buffer for safety
  const records_per_sync = Math.ceil(calls_per_sync * buffer_multiplier);
  const total_processed_daily = records_per_sync * syncs_per_day;
  const efficiency = ((calls_per_day / total_processed_daily) * 100).toFixed(1);

  console.log(`\n${label} (${calls_per_day.toLocaleString()} calls/day):`);
  console.log(`  • Sync frequency: Every ${sync_frequency_minutes} minutes`);
  console.log(`  • Records per sync: ~${records_per_sync}`);
  console.log(`  • Daily processing: ${Math.round(total_processed_daily).toLocaleString()} records`);
  console.log(`  • Efficiency: ${efficiency}% (minimal redundancy)`);
  console.log(`  • Estimated time: <1s per sync`);
});

console.log('\n\n📈 EFFICIENCY GAINS:');
console.log('-'.repeat(60));

scenarios.forEach(({ calls_per_day, label }) => {
  const old_daily = calls_per_day * 7 * 4; // 7 days × 4 syncs

  let sync_frequency_minutes;
  if (calls_per_day <= 1000) {
    sync_frequency_minutes = 360;
  } else if (calls_per_day <= 5000) {
    sync_frequency_minutes = 60;
  } else if (calls_per_day <= 10000) {
    sync_frequency_minutes = 30;
  } else {
    sync_frequency_minutes = 15;
  }

  const syncs_per_day = (24 * 60) / sync_frequency_minutes;
  const new_daily = Math.ceil(calls_per_day / syncs_per_day * 1.2) * syncs_per_day;

  const reduction = ((old_daily - new_daily) / old_daily * 100).toFixed(1);
  const improvement_factor = (old_daily / new_daily).toFixed(1);

  console.log(`\n${label}:`);

  if (calls_per_day * 7 > 10000) {
    console.log(`  • Old: ❌ BROKEN (exceeds limits)`);
    console.log(`  • New: ✅ ${new_daily.toLocaleString()} records/day`);
    console.log(`  • Result: System now works!`);
  } else if (calls_per_day <= 1000) {
    console.log(`  • No change needed (current setup works fine)`);
  } else {
    console.log(`  • Old: ${old_daily.toLocaleString()} records/day`);
    console.log(`  • New: ${new_daily.toLocaleString()} records/day`);
    console.log(`  • Reduction: ${reduction}% less processing`);
    console.log(`  • Speed: ${improvement_factor}x faster`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n💡 RECOMMENDATIONS:\n');
console.log('  • < 1,000 calls/day: Keep current setup');
console.log('  • 1,000-5,000 calls/day: Switch to hourly incremental');
console.log('  • 5,000-10,000 calls/day: Use 30-minute incremental');
console.log('  • 10,000+ calls/day: Use 15-minute incremental');
console.log('  • 50,000+ calls/day: Consider real-time webhooks');
console.log('\n' + '='.repeat(60));