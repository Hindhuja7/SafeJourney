import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Helper function to format phone number with country code
function formatPhoneNumber(phoneNumber, defaultCountryCode = "+91") {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
  
  // If already has country code (starts with +), return as is
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // If starts with 0, remove it (common in some countries)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // Add default country code if not present
  return `${defaultCountryCode}${cleaned}`;
}

// Helper to remove country code for Indian numbers (needed for some APIs)
function formatIndianNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+91")) {
    return cleaned.substring(3);
  }
  if (cleaned.startsWith("91")) {
    return cleaned.substring(2);
  }
  if (cleaned.startsWith("0")) {
    return cleaned.substring(1);
  }
  return cleaned;
}

// Send SMS using Twilio (primary) or other services
async function sendSMS(phoneNumber, message) {
  try {
    // Debug: Check environment variables
    console.log(`\n🔍 Environment Check:`);
    console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Found' : '❌ Not found'}`);
    console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Found' : '❌ Not found'}`);
    console.log(`   TWILIO_MESSAGING_SERVICE_SID: ${process.env.TWILIO_MESSAGING_SERVICE_SID ? '✅ Found' : '❌ Not found'}`);
    console.log(`   TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Found' : '❌ Not found'}`);
    console.log(`   DEFAULT_COUNTRY_CODE: ${process.env.DEFAULT_COUNTRY_CODE || '+91 (default - India)'}`);
    
    // Format phone number (Twilio accepts international format - works with +91 for India)
    const formattedPhone = formatPhoneNumber(phoneNumber, process.env.DEFAULT_COUNTRY_CODE || "+91");
    console.log(`\n📱 Attempting to send SMS to: ${formattedPhone} (original: ${phoneNumber})`);
    
    // Option 1: Twilio (RECOMMENDED - Works globally, reliable)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        console.log(`🔑 Twilio credentials found`);
        console.log(`📡 Calling Twilio API`);
        
      const twilio = await import("twilio");
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

        // Use MessagingServiceSid if available (recommended), otherwise use From number
        const messageParams = {
        body: message,
          to: formattedPhone,
        };

        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
          messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
          console.log(`📋 Using Messaging Service SID: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`);
        } else if (process.env.TWILIO_PHONE_NUMBER) {
          messageParams.from = process.env.TWILIO_PHONE_NUMBER;
          console.log(`📋 Using Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
        } else {
          throw new Error("Either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER must be set");
        }

        console.log(`📋 Parameters:`, {
          to: formattedPhone,
          messageLength: message.length
        });

        const result = await client.messages.create(messageParams);
        
        console.log(`📥 Twilio Response:`, {
          sid: result.sid,
          status: result.status,
          to: result.to,
          from: result.from || result.messagingServiceSid
        });
        
        console.log(`✅ SMS sent via Twilio to ${formattedPhone} (SID: ${result.sid})`);
        return { success: true, method: "Twilio", phone: formattedPhone, sid: result.sid };
      } catch (twilioError) {
        console.error(`❌ Twilio error for ${formattedPhone}:`, {
          code: twilioError.code,
          message: twilioError.message,
          status: twilioError.status,
          moreInfo: twilioError.moreInfo
        });
        // Don't fall through - Twilio errors are usually critical
        return { success: false, error: twilioError.message, phone: formattedPhone };
      }
    } else {
      console.warn(`⚠️  Twilio credentials not found. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN`);
    }

    // Option 2: Fast2SMS (FREE tier available for India)
    if (process.env.FAST2SMS_API_KEY) {
      console.log(`🔑 Fast2SMS API Key found: ${process.env.FAST2SMS_API_KEY.substring(0, 10)}...`);
      try {
        const indianNumber = formatIndianNumber(formattedPhone);
        
        // Validate phone number
        if (!indianNumber || indianNumber.length < 10) {
          throw new Error(`Invalid phone number: ${indianNumber} (must be 10 digits)`);
        }
        
        console.log(`📡 Calling Fast2SMS API`);
        console.log(`📋 Request Details:`, {
          url: "https://www.fast2sms.com/dev/bulkV2",
          numbers: indianNumber,
          messageLength: message.length,
          route: "q"
        });
        
        const requestBody = {
          route: "q",
          message: message,
          language: "english",
          numbers: indianNumber,
        };
        
        console.log(`📤 Request Body:`, JSON.stringify(requestBody, null, 2));
        
        const response = await axios.post("https://www.fast2sms.com/dev/bulkV2", requestBody, {
          headers: {
            "authorization": process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json"
          },
          timeout: 15000
        });
        
        console.log(`📥 Fast2SMS API Response Status:`, response.status);
        console.log(`📥 Fast2SMS API Response Data:`, JSON.stringify(response.data, null, 2));
        
        // Check different possible success indicators
        if (response.data.return === true || response.data.return === "true" || response.data.status === "success") {
          console.log(`✅ SMS sent via Fast2SMS (FREE) to ${formattedPhone}`);
          return { success: true, method: "Fast2SMS (Free)", phone: formattedPhone };
        } else {
          const errorMsg = response.data.message || response.data.error || JSON.stringify(response.data);
          console.error(`❌ Fast2SMS API returned error:`, errorMsg);
          throw new Error(errorMsg);
        }
      } catch (fast2smsError) {
        // Enhanced error logging
        if (fast2smsError.response) {
          console.error(`❌ Fast2SMS HTTP Error:`, {
            status: fast2smsError.response.status,
            statusText: fast2smsError.response.statusText,
            data: fast2smsError.response.data
          });
          const errorMsg = fast2smsError.response.data?.message || 
                          fast2smsError.response.data?.error || 
                          JSON.stringify(fast2smsError.response.data);
          console.error(`❌ Fast2SMS error for ${formattedPhone}:`, errorMsg);
        } else if (fast2smsError.request) {
          console.error(`❌ Fast2SMS Network Error: No response received`);
          console.error(`   Request was made but no response received`);
        } else {
          console.error(`❌ Fast2SMS Error:`, fast2smsError.message);
        }
        // Fall through to next service
      }
    } else {
      console.warn(`⚠️  FAST2SMS_API_KEY not found in environment variables`);
    }

    // Option 2: FreeTxtAPI (FREE - US/Canada only)
    if (process.env.FREETXTAPI_KEY && formattedPhone.startsWith("+1")) {
      try {
        // Remove +1 for US/Canada numbers
        const usNumber = formattedPhone.replace("+1", "");
        
        console.log(`📡 Calling FreeTxtAPI`);
        console.log(`📋 Parameters:`, {
          numbers: usNumber,
          messageLength: message.length
        });
        
        const response = await axios.post("https://freetxtapi.com/api/send", {
          key: process.env.FREETXTAPI_KEY,
          phone: usNumber,
          message: message
        }, {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 15000
        });
        
        console.log(`📤 FreeTxtAPI Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.success === true || response.data.status === "success") {
          console.log(`✅ SMS sent via FreeTxtAPI (FREE) to ${formattedPhone}`);
          return { success: true, method: "FreeTxtAPI (Free)", phone: formattedPhone };
        } else {
          throw new Error(response.data.message || "FreeTxtAPI error");
        }
      } catch (freetxtError) {
        const errorMsg = freetxtError.response?.data?.message || freetxtError.message;
        console.error(`❌ FreeTxtAPI error for ${formattedPhone}:`, errorMsg);
        // Fall through to next service
      }
    }

    // Option 3: MSG91 (Free credits available) - GOOD ALTERNATIVE
    if (process.env.MSG91_AUTH_KEY) {
      try {
        const indianNumber = formatIndianNumber(formattedPhone);
        
        console.log(`📡 Calling MSG91 API`);
        console.log(`📋 Parameters:`, {
          numbers: indianNumber,
          messageLength: message.length
        });
        
        // MSG91 API v2 format
        const response = await axios.post("https://control.msg91.com/api/v2/sendsms", {
          sender: process.env.MSG91_SENDER_ID || "SAFJNY",
          route: "4", // Transactional route
          country: "91",
          sms: [{
            message: message,
            to: [indianNumber]
          }]
        }, {
          headers: {
            "authkey": process.env.MSG91_AUTH_KEY,
            "Content-Type": "application/json"
          },
          timeout: 15000
        });
        
        console.log(`📤 MSG91 API Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.type === "success") {
          console.log(`✅ SMS sent via MSG91 to ${formattedPhone}`);
          return { success: true, method: "MSG91", phone: formattedPhone };
        } else {
          throw new Error(response.data.message || "MSG91 API error");
        }
      } catch (msg91Error) {
        const errorMsg = msg91Error.response?.data?.message || msg91Error.message;
        console.error(`❌ MSG91 error for ${formattedPhone}:`, errorMsg);
        if (msg91Error.response?.data) {
          console.error(`   Full response:`, JSON.stringify(msg91Error.response.data, null, 2));
        }
        // Fall through to next service
      }
    }

    // Option 4: smsmode (FREE - 20 free test credits)
    if (process.env.SMSMODE_API_KEY) {
      try {
        console.log(`📡 Calling smsmode API`);
        console.log(`📋 Parameters:`, {
          numbers: formattedPhone,
          messageLength: message.length
        });
        
        const response = await axios.post("https://api.smsmode.com/http/1.6/sendSMS.do", null, {
          params: {
            accessToken: process.env.SMSMODE_API_KEY,
            message: message,
            numero: formattedPhone.replace("+", ""), // Remove + for smsmode
            emetteur: process.env.SMSMODE_SENDER || "SafeJourney"
          },
          timeout: 15000
        });
        
        console.log(`📤 smsmode API Response:`, response.data);
        
        if (response.data.includes("OK") || response.status === 200) {
          console.log(`✅ SMS sent via smsmode (FREE) to ${formattedPhone}`);
          return { success: true, method: "smsmode (Free)", phone: formattedPhone };
        } else {
          throw new Error(response.data || "smsmode API error");
        }
      } catch (smsmodeError) {
        const errorMsg = smsmodeError.response?.data || smsmodeError.message;
        console.error(`❌ smsmode error for ${formattedPhone}:`, errorMsg);
        // Fall through to next service
      }
    }

    // Option 5: TextLocal (DEPRECATED - No longer available, kept for backward compatibility)
    if (process.env.TEXTLOCAL_API_KEY) {
      try {
        // TextLocal requires Indian numbers without country code
        const indianNumber = formatIndianNumber(formattedPhone);
        
        // TextLocal API accepts form data
        // Note: For India, use api.textlocal.in, for other countries use api.txtlocal.com
        const params = new URLSearchParams();
        params.append('apikey', process.env.TEXTLOCAL_API_KEY);
        params.append('numbers', indianNumber); // Indian numbers without country code
        params.append('message', message);
        params.append('sender', process.env.TEXTLOCAL_SENDER_ID || 'TXTLCL');
        
        // Try India endpoint first, fallback to international
        const apiEndpoint = process.env.TEXTLOCAL_API_URL || "https://api.textlocal.in/send/";
        
        console.log(`📡 Calling TextLocal API: ${apiEndpoint}`);
        console.log(`📋 Parameters:`, {
          numbers: indianNumber,
          sender: params.get('sender'),
          messageLength: message.length
        });
        
        const response = await axios.post(apiEndpoint, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000 // 15 second timeout
        });
        
        // Log response for debugging
        console.log(`📤 TextLocal API Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.status === "success") {
          console.log(`✅ SMS sent via TextLocal (FREE) to ${formattedPhone}`);
          return { success: true, method: "TextLocal (Free)", phone: formattedPhone };
        } else {
          const errorMsg = response.data.errors?.[0]?.message || response.data.message || "TextLocal API error";
          const errorCode = response.data.errors?.[0]?.code;
          console.error(`❌ TextLocal API returned error:`, {
            message: errorMsg,
            code: errorCode,
            fullResponse: response.data
          });
          throw new Error(errorMsg);
        }
      } catch (textLocalError) {
        // Log all errors to help debug
        const errorMsg = textLocalError.response?.data?.errors?.[0]?.message || 
                        textLocalError.response?.data?.message || 
                        textLocalError.message;
        const errorCode = textLocalError.response?.data?.errors?.[0]?.code;
        
        // Log error details for debugging
        if (textLocalError.response?.data) {
          console.error(`❌ TextLocal error for ${formattedPhone}:`, {
            message: errorMsg,
            code: errorCode,
            fullResponse: textLocalError.response.data
          });
        } else {
          console.error(`❌ TextLocal network error for ${formattedPhone}:`, errorMsg);
        }
        // Fall through to next service
      }
    }


    // Option 7: Generic SMS API service
    if (process.env.SMS_API_KEY && process.env.SMS_API_URL) {
      try {
      const response = await axios.post(process.env.SMS_API_URL, {
        apiKey: process.env.SMS_API_KEY,
          numbers: formattedPhone,
        message: message,
        sender: process.env.SMS_SENDER_ID || "SafeJourney",
      });
        console.log(`✅ SMS sent via SMS API to ${formattedPhone}`);
        return { success: true, method: "SMS API", phone: formattedPhone, response: response.data };
      } catch (apiError) {
        console.error(`❌ SMS API error for ${formattedPhone}:`, apiError.message);
        return { success: false, error: apiError.message, phone: formattedPhone };
      }
    }

    // Option 8: For development/testing - just log the message
    console.warn(`\n⚠️  SMS SERVICE NOT CONFIGURED`);
    console.warn(`📱 Phone: ${formattedPhone} (original: ${phoneNumber})`);
    console.warn(`💬 Message: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    console.warn(`💡 SMS Options:`);
    console.warn(`   1. Twilio (Recommended - Global): Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID`);
    console.warn(`   2. Fast2SMS (India - Free): Set FAST2SMS_API_KEY`);
    console.warn(`   3. MSG91 (India): Set MSG91_AUTH_KEY`);
    console.warn(`   4. FreeTxtAPI (US/Canada - Free): Set FREETXTAPI_KEY`);
    console.warn(`📖 See backend/TWILIO_SETUP.md for Twilio setup instructions\n`);
    return { success: true, method: "Console Log (Development Mode - No SMS sent)", phone: formattedPhone, warning: "SMS service not configured" };
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error.message);
    return { success: false, error: error.message, phone: phoneNumber };
  }
}

// Send location update to contacts
export async function sendLocationToContacts(contacts, location, userName = "User", customMessage = null) {
  const { latitude, longitude, address } = location;
  
  // Log contacts being processed
  console.log(`\n📤 Sending SMS to ${contacts.length} contact(s):`);
  contacts.forEach((contact, idx) => {
    console.log(`   ${idx + 1}. ${contact.name || 'Unknown'}: ${contact.phone}`);
  });
  
  let message;
  
  // If custom message provided, use it
  if (customMessage) {
    message = customMessage;
  }
  // If location is available, send location update
  else if (latitude && longitude) {
    // Create Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    // Format message
    message = `📍 SafeJourney Location Update\n\n${userName} is at:\n${address || `${latitude}, ${longitude}`}\n\nView on map: ${mapsLink}\n\nTime: ${new Date().toLocaleString()}`;
  } else {
    // Initial notification or status message
    message = address || `📍 SafeJourney: ${userName} has started sharing their live location with you.`;
  }

  // Send to all contacts
  const results = await Promise.allSettled(
    contacts.map((contact) =>
      sendSMS(contact.phone, message).then((result) => ({
        contact: contact.name,
        phone: contact.phone,
        ...result,
      }))
    )
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        contact: contacts[index].name,
        phone: contacts[index].phone,
        success: result.value.success,
        method: result.value.method,
        warning: result.value.warning,
        error: result.value.error || null,
      };
    } else {
      return {
        contact: contacts[index].name,
        phone: contacts[index].phone,
        success: false,
        error: result.reason?.message || "Unknown error",
      };
    }
  });
}

// Send emergency SOS alert to contacts
export async function sendEmergencyAlert(contacts, location, userName = "User", policeStations = []) {
  const { latitude, longitude, address } = location;
  
  console.log(`\n🚨 SENDING EMERGENCY SOS ALERT to ${contacts.length} contact(s)`);
  
  // Create Google Maps link
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  
  // Build emergency message
  let message = `🚨 EMERGENCY SOS ALERT 🚨\n\n`;
  message += `${userName} is NOT SAFE and needs immediate help!\n`;
  message += `User did not respond to safety check-in.\n\n`;
  message += `📍 Current Location:\n${address || `${latitude}, ${longitude}`}\n`;
  message += `🗺️ View on map: ${mapsLink}\n\n`;
  message += `⏰ Time: ${new Date().toLocaleString()}\n\n`;
  
  // Add police station info if available
  if (policeStations.length > 0) {
    message += `🚔 Nearest Police Stations (Please contact them):\n`;
    policeStations.slice(0, 2).forEach((station, idx) => {
      message += `${idx + 1}. ${station.name} (${station.distance} km away)\n`;
      message += `   📍 ${station.address}\n`;
      message += `   🗺️ https://www.google.com/maps?q=${station.latitude},${station.longitude}\n\n`;
    });
    message += `⚠️ Please contact the nearest police station immediately!\n\n`;
  }
  
  message += `📞 Emergency Numbers:\n`;
  message += `Police: 100\n`;
  message += `Women Helpline: 1091\n`;
  message += `Child Helpline: 1098\n\n`;
  message += `⚠️ Please take immediate action! Contact police if needed!`;

  // Send to all contacts
  const results = await Promise.allSettled(
    contacts.map((contact) =>
      sendSMS(contact.phone, message).then((result) => ({
        contact: contact.name,
        phone: contact.phone,
        ...result,
      }))
    )
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        contact: contacts[index].name,
        phone: contacts[index].phone,
        success: result.value.success,
        method: result.value.method,
        warning: result.value.warning,
        error: result.value.error || null,
      };
    } else {
      return {
    contact: contacts[index].name,
    phone: contacts[index].phone,
        success: false,
        error: result.reason?.message || "Unknown error",
      };
    }
  });
}

export default { sendSMS, sendLocationToContacts, sendEmergencyAlert };

