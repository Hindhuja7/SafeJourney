// Quick test script to verify Twilio setup
import dotenv from "dotenv";
dotenv.config();

console.log("\n🔍 Testing Twilio Configuration...\n");

// Check environment variables
const checks = {
  "TWILIO_ACCOUNT_SID": process.env.TWILIO_ACCOUNT_SID,
  "TWILIO_AUTH_TOKEN": process.env.TWILIO_AUTH_TOKEN,
  "TWILIO_MESSAGING_SERVICE_SID": process.env.TWILIO_MESSAGING_SERVICE_SID,
  "DEFAULT_COUNTRY_CODE": process.env.DEFAULT_COUNTRY_CODE || "+91 (default)",
};

console.log("Environment Variables:");
Object.entries(checks).forEach(([key, value]) => {
  if (key === "TWILIO_AUTH_TOKEN") {
    console.log(`  ${key}: ${value ? `✅ Found (${value.substring(0, 10)}...)` : '❌ Not found'}`);
  } else {
    console.log(`  ${key}: ${value ? `✅ Found (${value})` : '❌ Not found'}`);
  }
});

// Check if Twilio package is installed
try {
  const twilio = await import("twilio");
  console.log("\n✅ Twilio package is installed");
  
  // Test client creation
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("✅ Twilio client created successfully");
    
    // Check if Messaging Service SID is set
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      console.log(`✅ Messaging Service SID configured: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`);
    } else {
      console.log("⚠️  TWILIO_MESSAGING_SERVICE_SID not set (will use TWILIO_PHONE_NUMBER if available)");
    }
  } else {
    console.log("\n❌ Missing Twilio credentials in .env file");
  }
} catch (error) {
  console.log("\n❌ Twilio package not installed");
  console.log("   Run: npm install twilio");
}

console.log("\n📋 Summary:");
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_MESSAGING_SERVICE_SID) {
  console.log("✅ All Twilio credentials are configured!");
  console.log("✅ Ready to send SMS to selected contacts");
} else {
  console.log("⚠️  Some Twilio credentials are missing");
  console.log("   Make sure .env file has:");
  console.log("   - TWILIO_ACCOUNT_SID");
  console.log("   - TWILIO_AUTH_TOKEN");
  console.log("   - TWILIO_MESSAGING_SERVICE_SID");
}

console.log("\n");

