import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { CronJob } from 'cron';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AlarmData {
  objectId: string;
  owner: string;
  habit_type: string;
  wake_up_time: string;
  deposit_amount: string;
  charity_address: string;
  is_active: boolean;
  is_completed: boolean;
}

class CharityBot {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private maxGasBudget: number;

  constructor() {
    const rpcUrl = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
    this.suiClient = new SuiClient({ url: rpcUrl });
    
    const privateKeyString = process.env.BOT_PRIVATE_KEY;
    if (!privateKeyString) {
      throw new Error('BOT_PRIVATE_KEY environment variable is required');
    }
    
    // Handle Sui bech32 private key format (starts with 'suiprivkey')
    if (privateKeyString.startsWith('suiprivkey')) {
      this.keypair = Ed25519Keypair.fromSecretKey(privateKeyString);
    } else {
      // Handle base64 format (fallback)
      this.keypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKeyString));
    }
    
    this.packageId = process.env.ALARM_PACKAGE_ID || '';
    if (!this.packageId) {
      throw new Error('ALARM_PACKAGE_ID environment variable is required');
    }
    
    this.maxGasBudget = parseInt(process.env.MAX_GAS_BUDGET || '10000000');
    
    this.log('info', 'Charity Bot initialized');
    this.log('info', `Bot address: ${this.keypair.toSuiAddress()}`);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Get all alarm objects from the blockchain
   */
  async getAllAlarms(): Promise<AlarmData[]> {
    try {
      this.log('info', 'Fetching alarm objects...');
      
      // Query AlarmCreated events to find all alarm objects
      const events = await this.suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::alarm::AlarmCreated`
        },
        limit: 1000,
        order: 'descending'
      });

      if (events.data.length === 0) {
        this.log('info', 'No AlarmCreated events found');
        return [];
      }

      const alarmIds = new Set<string>();
      const alarms: AlarmData[] = [];

      // Extract alarm IDs from events
      for (const event of events.data) {
        if (event.parsedJson && typeof event.parsedJson === 'object') {
          const eventData = event.parsedJson as any;
          if (eventData.alarm_id) {
            alarmIds.add(eventData.alarm_id);
          }
        }
      }

      this.log('info', `Found ${alarmIds.size} unique alarm IDs`);

      // Fetch each alarm object's current state
      for (const alarmId of alarmIds) {
        try {
          const response = await this.suiClient.getObject({
            id: alarmId,
            options: {
              showContent: true,
              showOwner: true,
            }
          });

          if (response.data?.content?.dataType === 'moveObject') {
            const fields = response.data.content.fields as any;
            alarms.push({
              objectId: response.data.objectId,
              owner: fields.owner,
              habit_type: fields.habit_type,
              wake_up_time: fields.wake_up_time,
              deposit_amount: fields.deposit_amount,
              charity_address: fields.charity_address,
              is_active: fields.is_active,
              is_completed: fields.is_completed,
            });
          }
        } catch (error) {
          this.log('warn', `Failed to fetch alarm ${alarmId}:`, error);
        }
      }

      this.log('info', `Found ${alarms.length} total alarms`);
      return alarms;
    } catch (error) {
      this.log('error', 'Failed to fetch alarms', error);
      return [];
    }
  }

  /**
   * Check if an alarm can be failed (past grace period)
   */
  private canFailAlarm(alarm: AlarmData): boolean {
    const currentTime = Date.now();
    const wakeUpTime = parseInt(alarm.wake_up_time);
    const gracePeriodEnd = wakeUpTime + (60 * 60 * 1000); // 1 hour grace period (60 min × 60 sec × 1000ms)
    
    return currentTime >= gracePeriodEnd && 
           alarm.is_active && 
           !alarm.is_completed;
  }

  /**
   * Get all alarms that should be failed (sent to charity)
   */
  async getFailableAlarms(): Promise<AlarmData[]> {
    const allAlarms = await this.getAllAlarms();
    const failableAlarms = allAlarms.filter(alarm => this.canFailAlarm(alarm));
    
    this.log('info', `Found ${failableAlarms.length} alarms that can be failed`);
    
    if (failableAlarms.length > 0) {
      failableAlarms.forEach(alarm => {
        this.log('info', `Failable alarm: ${alarm.objectId} (${alarm.habit_type})`);
      });
    }
    
    return failableAlarms;
  }

  /**
   * Execute fail_alarm transaction for a specific alarm
   */
  async failAlarm(alarm: AlarmData): Promise<boolean> {
    try {
      this.log('info', `Attempting to fail alarm: ${alarm.objectId}`);
      
      const tx = new Transaction();
      
      // Get the clock object
      const clock = tx.object('0x6');
      
      // Call the fail_alarm function
      tx.moveCall({
        arguments: [tx.object(alarm.objectId), clock],
        target: `${this.packageId}::alarm::fail_alarm`,
      });
      
      // Set gas budget
      tx.setGasBudget(this.maxGasBudget);
      
      // Sign and execute transaction
      const result = await this.suiClient.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      if (result.effects?.status?.status === 'success') {
        this.log('info', `Successfully failed alarm ${alarm.objectId}`, {
          transactionDigest: result.digest,
          habitType: alarm.habit_type,
          depositAmount: alarm.deposit_amount,
          charityAddress: alarm.charity_address
        });
        return true;
      } else {
        this.log('error', `Transaction failed for alarm ${alarm.objectId}`, result.effects?.status);
        return false;
      }
    } catch (error) {
      this.log('error', `Error failing alarm ${alarm.objectId}`, error);
      return false;
    }
  }

  /**
   * Process all failable alarms
   */
  async processFailableAlarms(): Promise<void> {
    this.log('info', 'Starting charity bot check...');
    
    try {
      const failableAlarms = await this.getFailableAlarms();
      
      if (failableAlarms.length === 0) {
        this.log('info', 'No alarms need to be failed at this time');
        return;
      }
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const alarm of failableAlarms) {
        const success = await this.failAlarm(alarm);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // Add a small delay between transactions to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.log('info', `Charity bot check completed. Success: ${successCount}, Failures: ${failureCount}`);
      
    } catch (error) {
      this.log('error', 'Error during charity bot processing', error);
    }
  }

  /**
   * Start the bot with periodic checking
   */
  start(): void {
    const checkIntervalMinutes = parseInt(process.env.CHECK_INTERVAL_MINUTES || '5');
    
    this.log('info', `Starting charity bot with ${checkIntervalMinutes}-minute intervals`);
    
    // Run immediately on start
    this.processFailableAlarms();
    
    // Set up cron job to run every N minutes
    const cronPattern = `*/${checkIntervalMinutes} * * * *`;
    const job = new CronJob(cronPattern, () => {
      this.processFailableAlarms();
    });
    
    job.start();
    this.log('info', `Charity bot is running. Cron pattern: ${cronPattern}`);
  }

  /**
   * Get bot wallet balance
   */
  async getBalance(): Promise<void> {
    try {
      const balance = await this.suiClient.getBalance({
        owner: this.keypair.toSuiAddress(),
      });
      
      this.log('info', `Bot wallet balance: ${balance.totalBalance} SUI`);
    } catch (error) {
      this.log('error', 'Failed to get bot balance', error);
    }
  }
}

export default CharityBot;