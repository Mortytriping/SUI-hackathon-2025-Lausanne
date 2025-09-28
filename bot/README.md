# Charity Bot

Automated bot that monitors expired alarm contracts and sends their deposits to charity.

## Setup

1. **Install dependencies:**
   ```bash
   cd bot
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `BOT_PRIVATE_KEY`: Your bot wallet private key (base64 encoded)
   - `ALARM_PACKAGE_ID`: The deployed alarm smart contract package ID
   - `SUI_RPC_URL`: Sui RPC endpoint (testnet/mainnet)
   - `CHECK_INTERVAL_MINUTES`: How often to check for expired alarms (default: 5 minutes)

3. **Generate bot wallet:**
   ```bash
   sui client new-address ed25519
   ```
   Copy the private key to your `.env` file.

4. **Fund bot wallet:**
   The bot needs SUI tokens to pay for transaction fees. Send some SUI to the bot's address.

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Watch mode
```bash
npm run watch
```

## How it works

1. **Monitoring**: Bot checks every N minutes for alarms that have passed their grace period
2. **Identification**: Finds alarms where `currentTime >= wakeUpTime + 1hour` and `is_active = true` and `is_completed = false`
3. **Execution**: Automatically calls `fail_alarm` on expired alarms
4. **Charity Transfer**: The smart contract sends the deposit to the specified charity address
5. **Logging**: All operations are logged with timestamps and transaction details

## Bot Features

- ✅ **Automatic monitoring** of all alarm contracts
- ✅ **Grace period respect** (1 hour after wake-up time)
- ✅ **Periodic execution** with configurable intervals
- ✅ **Comprehensive logging** of all operations
- ✅ **Error handling** and retry logic
- ✅ **Gas budget management**
- ✅ **Balance monitoring**

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_PRIVATE_KEY` | Bot wallet private key (base64) | Required |
| `ALARM_PACKAGE_ID` | Smart contract package ID | Required |
| `SUI_RPC_URL` | Sui RPC endpoint | testnet |
| `CHECK_INTERVAL_MINUTES` | Check frequency in minutes | 5 |
| `MAX_GAS_BUDGET` | Maximum gas per transaction | 10000000 |
| `LOG_LEVEL` | Logging level | info |

## Monitoring

The bot logs all operations including:
- Alarm discoveries
- Transaction executions
- Success/failure counts
- Error details
- Balance updates

## Security Notes

- Keep your bot private key secure
- Use a dedicated wallet for the bot
- Monitor bot balance regularly
- Test on testnet before mainnet deployment