import CharityBot from './CharityBot';

async function main() {
  try {
    // Initialize the charity bot
    const bot = new CharityBot();
    
    // Check bot wallet balance
    await bot.getBalance();
    
    // Start the bot
    bot.start();
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n[INFO] Charity bot shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n[INFO] Charity bot shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('[ERROR] Failed to start charity bot:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the bot
main();