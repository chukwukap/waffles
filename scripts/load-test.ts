#!/usr/bin/env ts-node

/**
 * Simple load testing script using autocannon
 * Tests concurrent waitlist joins and invite redemptions
 */

import autocannon from "autocannon";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function runLoadTest() {
  console.log("🚀 Starting load test...\n");

  // Test 1: Waitlist Join Endpoints
  console.log("📊 Test 1: Waitlist Join Load Test");
  console.log("Testing 500 concurrent requests over 30 seconds\n");

  const waitlistResult = await autocannon({
    url: `${BASE_URL}/api/waitlist`,
    connections: 50, // concurrent connections
    duration: 30, // seconds
    pipelining: 1,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fid: Math.floor(Math.random() * 100000), // Random FID
      ref: Math.floor(Math.random() * 1000),
    }),
  });

  autocannon.printResult(waitlistResult);

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 2: Invite Redemption
  console.log("📊 Test 2: Invite Redemption Load Test");
  console.log("Testing concurrent invite redemptions\n");

  const inviteResult = await autocannon({
    url: `${BASE_URL}/api/invite`,
    connections: 30,
    duration: 20,
    pipelining: 1,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fid: Math.floor(Math.random() * 100000),
      code: "TEST_CODE_" + Math.random().toString(36).substring(7),
    }),
  });

  autocannon.printResult(inviteResult);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ Load Test Complete!\n");
  console.log("Summary:");
  console.log(`  Waitlist Requests: ${waitlistResult.requests.total}`);
  console.log(`  Waitlist Avg Latency: ${waitlistResult.latency.mean}ms`);
  console.log(`  Waitlist Errors: ${waitlistResult.errors}`);
  console.log("");
  console.log(`  Invite Requests: ${inviteResult.requests.total}`);
  console.log(`  Invite Avg Latency: ${inviteResult.latency.mean}ms`);
  console.log(`  Invite Errors: ${inviteResult.errors}`);
  console.log("=".repeat(60));
}

// Run if called directly
if (require.main === module) {
  runLoadTest().catch(console.error);
}

export { runLoadTest };
