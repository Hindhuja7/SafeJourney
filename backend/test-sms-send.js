// Test script to send a real SMS
import dotenv from "dotenv";
import smsService from "./services/smsService.js";

dotenv.config();

const { sendSMS } = smsService;

console.log("\n🧪 Testing SMS Sending...\n");

// Test phone number (replace with your number)
const testPhoneNumber = process.argv[2] || "+919381503017";
const testMessage = "🧪 Test SMS from SafeJourney - If you receive this, SMS is working!";

console.log(`📱 Sending test SMS to: ${testPhoneNumber}`);
console.log(`📝 Message: ${testMessage}\n`);

try {
  const result = await sendSMS(testPhoneNumber, testMessage);
  
  console.log("\n📊 Result:");
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log("\n✅ SMS sent successfully!");
    console.log(`   Method: ${result.method}`);
    console.log(`   Phone: ${result.phone}`);
    if (result.sid) {
      console.log(`   SID: ${result.sid}`);
    }
  } else {
    console.log("\n❌ SMS failed to send");
    console.log(`   Error: ${result.error}`);
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error);
}

console.log("\n");

