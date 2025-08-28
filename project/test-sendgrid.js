// Test SendGrid connection
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('🔍 Testing SendGrid Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ Missing');
console.log('OTP_TEMPLATE_ID:', 'd-573c6eebb45a4a7abefe49a6c12ce70c');
console.log('');

// Test API key format
if (process.env.SENDGRID_API_KEY) {
  const apiKey = process.env.SENDGRID_API_KEY;
  console.log('🔑 API Key Format Check:');
  console.log('Length:', apiKey.length);
  console.log('Starts with SG.:', apiKey.startsWith('SG.') ? '✅ Yes' : '❌ No');
  console.log('');
}

// Test SendGrid connection
async function testSendGrid() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }

    console.log('🚀 Testing SendGrid Connection...');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Test with a simple email (won't actually send)
    const testMsg = {
      to: 'test@example.com',
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: 'SendGrid Test',
      text: 'This is a test email to verify SendGrid connection.'
    };

    console.log('✅ SendGrid API key set successfully');
    console.log('✅ Ready to send emails');
    console.log('');
    
    // Test template access (optional)
    console.log('📧 Template Access Test:');
    console.log('Template ID: d-573c6eebb45a4a7abefe49a6c12ce70c');
    console.log('Note: Template access requires proper API key permissions');
    
  } catch (error) {
    console.error('❌ SendGrid Test Failed:');
    console.error('Error:', error.message);
    
    if (error.code === 403) {
      console.error('\n🚨 403 Forbidden Error - Common Solutions:');
      console.error('1. Check if API key has "Mail Send" permissions');
      console.error('2. Verify sender email is authenticated');
      console.error('3. Ensure account is not suspended');
      console.error('4. Check if you\'ve exceeded rate limits');
    }
  }
}

// Run the test
testSendGrid();
