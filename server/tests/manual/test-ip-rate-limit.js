/**
 * Manual Test Script for IP-Based Rate Limiting
 *
 * This script tests the new IP-based rate limiting for unauthenticated requests.
 * It sends multiple requests without authentication to verify the rate limit is enforced.
 */

const BASE_URL = "http://localhost:3001/api/health";
const LIMIT = 100; // Default IP rate limit

async function testIpRateLimit() {
  console.log("🧪 Testing IP-Based Rate Limiting for Unauthenticated Users\n");
  console.log(`Sending ${LIMIT + 5} requests to ${BASE_URL}...\n`);

  let successCount = 0;
  let rateLimitedCount = 0;

  for (let i = 1; i <= LIMIT + 5; i++) {
    try {
      const response = await fetch(BASE_URL);
      const headers = {
        limit: response.headers.get("X-RateLimit-Limit"),
        remaining: response.headers.get("X-RateLimit-Remaining"),
        reset: response.headers.get("X-RateLimit-Reset"),
        type: response.headers.get("X-RateLimit-Type"),
      };

      if (response.status === 429) {
        rateLimitedCount++;
        const body = await response.json();
        console.log(`❌ Request #${i}: RATE LIMITED`);
        console.log(`   Retry After: ${body.retryAfter}s`);
        console.log(`   Message: ${body.message}`);
        console.log(`   Headers:`, headers);
        break;
      } else {
        successCount++;
        if (i === 1 || i % 20 === 0 || i >= LIMIT - 5) {
          console.log(`✅ Request #${i}: SUCCESS`);
          console.log(`   Headers:`, headers);
        }
      }
    } catch (error) {
      console.error(`❌ Request #${i}: ERROR - ${error.message}`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log("\n📊 Test Results:");
  console.log(`   Successful Requests: ${successCount}`);
  console.log(`   Rate Limited: ${rateLimitedCount}`);
  console.log(`   Expected Limit: ${LIMIT}`);

  if (successCount === LIMIT && rateLimitedCount > 0) {
    console.log("\n✅ IP-based rate limiting is working correctly!");
  } else {
    console.log("\n⚠️  Unexpected results. Please verify the implementation.");
  }
}

// Run the test
testIpRateLimit().catch(console.error);
