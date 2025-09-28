import { SuiClient } from '@mysten/sui/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAlarmQueries() {
  const suiClient = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' });
  const packageId = process.env.ALARM_PACKAGE_ID || '0x3fc2cdf2a6e45e710d1a074c7c2488671c23159df01d547a1fa43126846de1c0';
  
  console.log('🔍 Testing alarm queries...');
  console.log('Package ID:', packageId);
  
  // Test 1: Try to query events to find alarm objects
  try {
    console.log('\n🎉 Test 1: Query AlarmCreated events');
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::alarm::AlarmCreated`
      },
      limit: 20,
      order: 'descending'
    });
    
    console.log('Events found:', events.data.length);
    if (events.data.length > 0) {
      console.log('Sample event:', {
        type: events.data[0].type,
        parsedJson: events.data[0].parsedJson
      });
      
      // Try to get ALL alarm objects from the events and check their status
      const activeAlarms = [];
      const failableAlarms = [];
      
      for (let i = 0; i < events.data.length; i++) {
        const event = events.data[i];
        if (event.parsedJson && typeof event.parsedJson === 'object') {
          const eventData = event.parsedJson as any;
          const alarmId = eventData.alarm_id || eventData.id;
          
          if (alarmId) {
            try {
              const alarmObject = await suiClient.getObject({
                id: alarmId,
                options: {
                  showContent: true,
                  showOwner: true
                }
              });
              
              if (alarmObject.data?.content?.dataType === 'moveObject') {
                const fields = alarmObject.data.content.fields as any;
                
                // Time analysis for each alarm
                const currentTime = Date.now();
                const wakeUpTime = parseInt(fields.wake_up_time);
                const gracePeriodEnd = wakeUpTime + (60 * 60 * 1000); // 1 hour grace period
                const canFail = currentTime >= gracePeriodEnd && fields.is_active && !fields.is_completed;
                
                const alarmInfo = {
                  id: alarmId,
                  habit_type: fields.habit_type,
                  owner: fields.owner,
                  is_active: fields.is_active,
                  is_completed: fields.is_completed,
                  currentTime: new Date(currentTime).toLocaleString(),
                  wakeUpTime: new Date(wakeUpTime).toLocaleString(),
                  gracePeriodEnd: new Date(gracePeriodEnd).toLocaleString(),
                  canFail,
                  timePassedSinceGrace: currentTime - gracePeriodEnd,
                  deposit_amount: fields.deposit_amount,
                  charity_address: fields.charity_address
                };
                
                console.log(`\n🔍 Alarm ${i + 1}:`, alarmInfo);
                
                if (fields.is_active && !fields.is_completed) {
                  activeAlarms.push(alarmInfo);
                  if (canFail) {
                    failableAlarms.push(alarmInfo);
                  }
                }
              }
            } catch (objError) {
              console.log(`❌ Failed to get alarm object ${alarmId}:`, objError);
            }
          }
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`Total events checked: ${events.data.length}`);
      console.log(`Active alarms (is_active=true, is_completed=false): ${activeAlarms.length}`);
      console.log(`Failable alarms (past grace period): ${failableAlarms.length}`);
      
      if (activeAlarms.length > 0) {
        console.log(`\n✅ Active alarms found:`);
        activeAlarms.forEach((alarm, i) => {
          console.log(`  ${i + 1}. ${alarm.habit_type} (${alarm.id.slice(0, 10)}...) - Can fail: ${alarm.canFail}`);
        });
      }
      
      if (failableAlarms.length > 0) {
        console.log(`\n🚨 FAILABLE ALARMS (Bot should process these):`);
        failableAlarms.forEach((alarm, i) => {
          console.log(`  ${i + 1}. ${alarm.habit_type} (${alarm.id})`);
          console.log(`     - Grace period ended: ${Math.floor(alarm.timePassedSinceGrace / (1000 * 60))} minutes ago`);
          console.log(`     - Deposit: ${parseInt(alarm.deposit_amount) / 1_000_000_000} SUI`);
          console.log(`     - Charity: ${alarm.charity_address}`);
        });
      } else {
        console.log(`\n💡 No failable alarms found. This means either:`);
        console.log(`   - All active alarms are still within grace period`);
        console.log(`   - All expired alarms have been completed or failed already`);
        console.log(`   - No active alarms exist`);
      }
    }
  } catch (error) {
    console.log('❌ Events query failed:', error);
  }
  
  // Test 2: Query any events from the package
  try {
    console.log('\n🔍 Test 2: Query any events from alarm module');
    const anyEvents = await suiClient.queryEvents({
      query: {
        MoveModule: {
          package: packageId,
          module: 'alarm'
        }
      },
      limit: 10
    });
    
    console.log('Module events found:', anyEvents.data.length);
    if (anyEvents.data.length > 0) {
      anyEvents.data.forEach((event, i) => {
        console.log(`Event ${i + 1}:`, {
          type: event.type,
          parsedJson: event.parsedJson
        });
      });
    }
  } catch (error) {
    console.log('❌ Module events query failed:', error);
  }
  
  // Test 3: Check if you have a specific alarm ID to test with
  const testAlarmId = process.env.TEST_ALARM_ID;
  if (testAlarmId) {
    try {
      console.log('\n🎯 Test 3: Query specific alarm object');
      console.log('Test alarm ID:', testAlarmId);
      
      const alarmObject = await suiClient.getObject({
        id: testAlarmId,
        options: {
          showContent: true,
          showOwner: true
        }
      });
      
      console.log('Alarm object found:', {
        id: alarmObject.data?.objectId,
        type: alarmObject.data?.type,
        content: alarmObject.data?.content,
        owner: alarmObject.data?.owner
      });
      
      if (alarmObject.data?.content?.dataType === 'moveObject') {
        const fields = alarmObject.data.content.fields as any;
        console.log('Alarm details:', {
          owner: fields.owner,
          habit_type: fields.habit_type,
          wake_up_time: fields.wake_up_time,
          is_active: fields.is_active,
          is_completed: fields.is_completed,
          charity_address: fields.charity_address
        });
        
        // Check if it should be failed
        const currentTime = Date.now();
        const wakeUpTime = parseInt(fields.wake_up_time);
        const gracePeriodEnd = wakeUpTime + (60 * 60 * 1000);
        const canFail = currentTime >= gracePeriodEnd && fields.is_active && !fields.is_completed;
        
        console.log('Time analysis:', {
          currentTime: new Date(currentTime).toLocaleString(),
          wakeUpTime: new Date(wakeUpTime).toLocaleString(),
          gracePeriodEnd: new Date(gracePeriodEnd).toLocaleString(),
          canFail,
          isActive: fields.is_active,
          isCompleted: fields.is_completed
        });
      }
    } catch (error) {
      console.log('❌ Specific alarm query failed:', error);
    }
  } else {
    console.log('\n💡 To test a specific alarm, set TEST_ALARM_ID in your .env file');
  }
  
  console.log('\n✅ Testing complete');
}

testAlarmQueries().catch(console.error);