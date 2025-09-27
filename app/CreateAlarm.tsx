import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

// Common charity addresses (in a real app, you might fetch these from a database)
const CHARITY_OPTIONS = [
  { name: "Red Cross", address: "0x55d5de0dbbec8a3589a9025525cc950026da5128703ffc459dc881a23a8e1f80" },
  { name: "UNICEF", address: "0x2345678901234567890123456789012345678901" },
  { name: "Doctors Without Borders", address: "0x3456789012345678901234567890123456789012" },
  { name: "World Wildlife Fund", address: "0x4567890123456789012345678901234567890123" },
  { name: "Salvation Army", address: "0x5678901234567890123456789012345678901234" },
];

// Common habit types
const HABIT_OPTIONS = [
  "Wake Up Early",
  "Exercise",
  "Meditation",
  "Study/Learning",
  "Reading",
  "Healthy Eating",
  "Water Intake",
  "Journal Writing",
  "Language Practice",
  "Creative Work",
  "No Social Media",
  "Sleep Schedule",
  "Other"
];

export function CreateAlarm({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const alarmPackageId = useNetworkVariable("alarmPackageId");
  const suiClient = useSuiClient();
  const [habitType, setHabitType] = useState("");
  const [wakeUpTime, setWakeUpTime] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedCharity, setSelectedCharity] = useState("");
  
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  function createAlarm() {
    if (!habitType || !wakeUpTime || !depositAmount || !selectedCharity) {
      alert("Please fill all fields");
      return;
    }

    const wakeUpTimestamp = new Date(wakeUpTime).getTime();
    const depositInMIST = parseFloat(depositAmount) * 1_000_000_000; // Convert SUI to MIST

    console.log('Creating alarm transaction');
    const tx = new Transaction();

    // Split coin for the deposit
    const [coin] = tx.splitCoins(tx.gas, [depositInMIST]);

    tx.moveCall({
      arguments: [
        tx.pure.string(habitType),
        tx.pure.u64(wakeUpTimestamp),
        tx.pure.address(selectedCharity),
        coin,
      ],
      target: `${alarmPackageId}::alarm::create_alarm`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await suiClient.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });

          onCreated(effects?.created?.[0]?.reference?.objectId!);
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          alert("Failed to create alarm. Please try again.");
        },
      },
    );
  }

  // Get minimum datetime for input (current time + 1 minute)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16); // Format for datetime-local
  };

  return (
    <Card className="max-w-7xl mx-auto border-transparent bg-gray-50">
      <CardHeader>
        <CardTitle className="text-black text-center text-2xl">⏰ Create New Alarm</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Habit Type */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-black mb-2">🎯 Habit Type</h3>
              <p className="text-sm text-gray-600 mb-4">What habit are you building?</p>
            </div>
            <div>
              <label htmlFor="habitType" className="block text-sm font-medium text-gray-700 mb-2">
                Select Habit
              </label>
              <select
                id="habitType"
                value={habitType}
                onChange={(e) => setHabitType(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 8px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px 16px'
                }}
              >
                <option value="">Choose habit type...</option>
                {HABIT_OPTIONS.map((habit) => (
                  <option key={habit} value={habit}>
                    {habit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Column 2: Time Selection */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-black mb-2">🕐 Wake Up</h3>
              <p className="text-sm text-gray-600 mb-4">Set your wake-up goal</p>
            </div>
            <div>
              <label htmlFor="wakeUpTime" className="block text-sm font-medium text-gray-700 mb-2">
                Wake Up Date & Time
              </label>
              <input
                id="wakeUpTime"
                type="datetime-local"
                min={getMinDateTime()}
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Column 3: Deposit Amount */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">💰 Deposit Amount</h3>
              <p className="text-sm text-gray-600 mb-4">Your future self will thank you</p>
            </div>
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (SUI)
              </label>
              <input
                id="depositAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 0.01 SUI
              </p>
            </div>
          </div>

          {/* Column 4: Charity Selection */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🤝 Choose Charity</h3>
              <p className="text-sm text-gray-600 mb-4">Create positive impact either way</p>
            </div>
            <div>
              <label htmlFor="charity" className="block text-sm font-medium text-gray-700 mb-2">
                Select Charity
              </label>
              <select
                id="charity"
                value={selectedCharity}
                onChange={(e) => setSelectedCharity(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 8px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px 16px'
                }}
              >
                <option value="">Select a charity...</option>
                {CHARITY_OPTIONS.map((charity) => (
                  <option key={charity.address} value={charity.address}>
                    {charity.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Create Alarm Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={createAlarm}
            disabled={isSuccess || isPending || !habitType || !wakeUpTime || !depositAmount || !selectedCharity}
            className="w-full md:w-auto px-8 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            {isSuccess || isPending ? (
              <ClipLoader size={20} color="white" />
            ) : (
              "Submit"
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>How it works:</strong> Set your alarm and deposit SUI. You have 1 hour after your alarm time to mark it as completed. 
                If you don't complete it in time, your deposit automatically goes to your chosen charity. You can cancel anytime with a 10% fee.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}