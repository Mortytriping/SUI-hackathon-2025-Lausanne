# On Chain Habit Tracker

A decentralized habit tracking application built on Sui blockchain.

## Getting Started

### Prerequisites
- Node.js 18+
- Sui Wallet browser extension
- SUI tokens for testnet

### Installation

1. Clone the repository
```bash
git clone https://github.com/Mortytriping/SUI-hackathon
cd on-chain-habit-tracker
```

2. Install dependencies
```bash
pnpm install
```

3. Start development server
```bash
pnpm dev
```

Access the application at `http://localhost:3000`

## How to Use

### Connect Wallet
1. Install Sui Wallet extension
2. Create or import a wallet
3. Switch to Sui Testnet
4. Get testnet SUI from faucet: https://testnet.faucet.sui.io
5. Click "Connect Wallet" in the application

### Create a Habit Challenge

1. Navigate to the main page
2. Click "Create New Alarm"
3. Fill in the form:
   - **Habit Type**: Select from dropdown (Wake Up Early, Exercise, etc.)
   - **Date & Time**: Set your target wake-up time
   - **Deposit Amount**: Enter SUI amount to stake
   - **Charity**: Choose recipient for failed attempts
4. Click "Submit" and confirm the transaction

### Complete a Challenge

1. Navigate to your active alarm before the deadline
2. Click "Mark as Completed"
3. For "Wake Up Early" challenges: Type the displayed motivational sentence exactly
4. For other habits: Simple confirmation button
5. Confirm the transaction to retrieve your deposit

### View Dashboard

1. Click "Dashboard" in navigation
2. View statistics:
   - Total alarms created
   - Success rate
   - Recent activity
   - Funds donated to charity

### Find Existing Alarms

1. Click "Find Existing Alarms"
2. Enter the alarm Object ID
3. View alarm details and status

## Application Structure

### Main Components

**Homepage (`/`)**
- Create new alarm interface
- Search existing alarms
- Navigation between features

**Dashboard (`/dashboard`)**
- Personal statistics
- Activity history
- Success metrics

**Individual Alarm View**
- Alarm details and status
- Completion interface
- Cancellation options

### Alarm States

- **Active**: Waiting for target time
- **Ready to Complete**: Past target time, within grace period
- **Expired**: Past grace period, can be marked as failed
- **Completed**: Successfully completed by owner
- **Failed**: Automatically sent to charity
- **Cancelled**: Cancelled by owner (10% fee)

## Smart Contract Functions

### create_alarm
Creates a new habit challenge with:
- Habit type
- Target completion time
- Deposit amount
- Charity address

### complete_alarm
Marks alarm as completed and returns deposit to owner.

### fail_alarm
Transfers deposit to specified charity (can be called by anyone after grace period).

### cancel_alarm
Cancels alarm with 10% cancellation fee.

## Technical Details

### Blockchain Integration
- **Network**: Sui Testnet
- **Language**: Move smart contracts
- **SDK**: @mysten/dapp-kit for React integration

### Authentication
- zkLogin for Google OAuth integration
- Traditional Sui wallet connection

### Frontend Stack
- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- React components

## File Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Homepage
├── App.tsx                 # Main application component
├── dashboard/
│   └── page.tsx            # Dashboard page
├── components/
│   ├── Navbar.tsx          # Navigation
│   ├── AlarmList.tsx       # Alarm search
│   ├── ThemeProvider.tsx   # Theme management
│   └── zklogin/           # Authentication components
├── Alarm.tsx               # Individual alarm display
├── CreateAlarm.tsx         # Alarm creation form
└── globals.css             # Global styles
```

## Configuration

### Network Configuration
The application connects to Sui Testnet by default. Configuration is in `networkConfig.ts`.

### Theme Support
The application supports light and dark themes with automatic detection of system preferences.

## Troubleshooting

### Common Issues

**Wallet Connection Failed**
- Ensure Sui Wallet extension is installed
- Check you're on Sui Testnet
- Refresh the page and try again

**Transaction Failed**
- Verify sufficient SUI balance for gas fees
- Check network connectivity
- Ensure alarm parameters are valid

**Alarm Not Found**
- Verify the Object ID is correct (66 characters, starts with 0x)
- Check the alarm exists on testnet

### Getting Help

For technical issues:
1. Check browser console for error messages
2. Verify wallet connection and network
3. Ensure sufficient SUI balance for transactions

## Development

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
- Development: `npm run dev`
- Production build: `npm run build`
- Type checking: `npm run type-check`

### Smart Contract Deployment
Contracts are pre-deployed on Sui Testnet. For custom deployment:
1. Install Sui CLI
2. Compile Move contracts
3. Deploy to network
4. Update package ID in configuration