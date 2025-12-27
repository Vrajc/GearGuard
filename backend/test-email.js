require('dotenv').config();
const { sendPasswordResetEmail } = require('./src/utils/email');

// Test email sending
sendPasswordResetEmail('your-test-email@example.com', 'test-token-123')
  .then(() => {
    console.log('✅ Email test successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  });
