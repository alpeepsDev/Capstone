// Configuration
const BASE_URL = "http://localhost:3001/api/v1/user"; // Adjust port if needed
const EMAIL = "alex.rivera@taskforge.io"; // Replace with a valid user email
const PASSWORD = "password123"; // Replace with a valid password

async function runTests() {
  console.log("🚀 Starting AI Validation Tests...\n");

  // 1. Login to get token
  console.log("1️⃣ Logging in...");
  let token;
  try {
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const loginData = await loginRes.json();

    if (!loginData.success) {
      console.error("❌ Login failed:", loginData.message);
      console.log(
        "➡️ Please ensure the server is running and credentials are correct.",
      );
      return;
    }

    token = loginData.token;
    console.log("✅ Login successful. Token received.\n");
  } catch (error) {
    console.error("❌ Network error during login:", error.message);
    console.log(
      "➡️ Make sure the server is running on port 3001 (or check .env).",
    );
    return;
  }

  // Helper function for authorized requests
  const post = async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  // 2. Test Ask Nova Validation
  console.log("2️⃣ Testing Ask Nova Validation (/ai/query)");

  // 2a. Valid Query
  console.log("   Test 2a: Valid Query");
  const validQuery = await post("/ai/query", {
    query: "List my overdue tasks",
  });
  if (validQuery.success) console.log("   ✅ Success (Valid query accepted)");
  else console.log("   ❌ Failed (Valid query rejected):", validQuery.message);

  // 2b. Empty Query
  console.log("   Test 2b: Empty Query");
  const emptyQuery = await post("/ai/query", { query: "" });
  if (!emptyQuery.success && emptyQuery.message === "Validation errors") {
    console.log("   ✅ Success (Empty query rejected)");
  } else {
    console.log(
      "   ❌ Failed (Empty query accepted or wrong error):",
      emptyQuery.message,
    );
  }

  // 3. Test Proofread Validation
  console.log("\n3️⃣ Testing Proofread Validation (/ai/proofread)");

  // 3a. Valid Text
  console.log("   Test 3a: Valid Text");
  const validText = await post("/ai/proofread", { text: "This is a test." });
  if (validText.success) console.log("   ✅ Success (Valid text accepted)");
  else console.log("   ❌ Failed (Valid text rejected):", validText.message);

  // 3b. Empty Text
  console.log("   Test 3b: Empty Text");
  const emptyText = await post("/ai/proofread", { text: "" });
  if (!emptyText.success && emptyText.message === "Validation errors") {
    console.log("   ✅ Success (Empty text rejected)");
  } else {
    console.log(
      "   ❌ Failed (Empty text accepted or wrong error):",
      emptyText.message,
    );
  }

  console.log("\n🏁 Tests Completed.");
}

runTests();
