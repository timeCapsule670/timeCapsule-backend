import * as messageService from './services/messageService';

// Default interval is 1 minute (can be configured via env)
const checkInterval = process.env.MESSAGE_CHECK_INTERVAL 
  ? parseInt(process.env.MESSAGE_CHECK_INTERVAL, 10) 
  : 60000;

// Start the scheduler
export const startMessageScheduler = () => {
  console.log(`Message delivery scheduler started. Checking every ${checkInterval / 1000} seconds.`);
  
  // Run immediately on startup
  messageService.checkMessagesForDelivery();
  
  // Set up regular interval checks
  setInterval(() => {
    messageService.checkMessagesForDelivery();
  }, checkInterval);
};