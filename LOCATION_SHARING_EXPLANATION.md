# How Location Sharing Works

## Current Implementation

### What Happens When You Import Contacts:

1. **Import Contacts**: When you click "Import from Device" and select contacts:
   - Contact names and phone numbers are stored
   - They appear in the contact selection list
   - You can select which contacts to share with

2. **Start Sharing**: When you start live location sharing:
   - Your location is tracked using GPS
   - Location updates are sent to the backend
   - **SMS messages are sent to selected contacts' phone numbers** with:
     - Your current location (address)
     - Google Maps link to your location
     - Timestamp

3. **Location Updates**: Every X minutes (based on your selected interval):
   - Your new location is detected
   - SMS is automatically sent to all selected contacts
   - They receive your updated location via text message

## SMS Service Setup

### Option 1: Twilio (Recommended for Production)

1. **Sign up for Twilio**: https://www.twilio.com
2. **Get credentials**:
   - Account SID
   - Auth Token
   - Phone Number

3. **Add to `.env` file**:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Install Twilio**:
   ```bash
   cd backend
   npm install twilio
   ```

### Option 2: Other SMS Services

You can use any SMS API service:
- TextLocal (India)
- MSG91 (India)
- AWS SNS
- Any other SMS gateway

Add credentials to `.env`:
```
SMS_API_KEY=your_api_key
SMS_API_URL=https://api.smsservice.com/send
SMS_SENDER_ID=SafeJourney
```

### Option 3: Development Mode

If no SMS service is configured, the system will:
- Log SMS messages to console (for testing)
- Show what would be sent to contacts
- Allow you to test without actual SMS charges

## What Contacts Receive

When location is updated, each selected contact receives an SMS like:

```
📍 SafeJourney Location Update

Hindhuja is at:
123 Main Street, Hyderabad, Telangana, India

View on map: https://www.google.com/maps?q=17.3971,78.4900

Time: 12/25/2024, 3:45:30 PM
```

## Important Notes

1. **Phone Number Format**: 
   - Must include country code (e.g., +91XXXXXXXXXX for India)
   - Format: +[country code][number]

2. **SMS Costs**: 
   - Twilio charges per SMS (varies by country)
   - Free tier available for testing
   - Production use requires paid account

3. **Privacy**: 
   - Only selected contacts receive location
   - Location is sent via SMS (secure)
   - Contacts can view location on Google Maps

4. **Testing**: 
   - In development, SMS is logged to console
   - No actual SMS sent unless service is configured
   - Check backend console to see what would be sent

## Setup Instructions

1. **For Testing (No SMS sent)**:
   - Just run the app - SMS will be logged to console
   - Check backend terminal to see messages

2. **For Production (Real SMS)**:
   - Set up Twilio account
   - Add credentials to `.env`
   - Install Twilio: `npm install twilio`
   - Restart backend server

## Example SMS Flow

1. User starts sharing → SMS sent to 3 contacts
2. After 5 minutes → Location updated → SMS sent again
3. After 10 minutes → Location updated → SMS sent again
4. User stops sharing → No more SMS sent

Each SMS includes:
- Current address (if available)
- Google Maps link
- Timestamp

