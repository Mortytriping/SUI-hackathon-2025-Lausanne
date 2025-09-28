import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";

// Positive wake-up sentences for verification
const WAKE_UP_SENTENCES = [
  "I am grateful for this beautiful morning and ready to embrace the day",
  "Today is full of endless possibilities and I choose to make it amazing",
  "I am energized, focused, and prepared to achieve my goals today",
  "This morning brings new opportunities and I welcome them with open arms",
  "I am blessed with another day to make a positive difference in the world",
  "My mind is clear, my body is strong, and I am ready for today's adventures",
  "I choose happiness, productivity, and success in everything I do today",
  "Today I will be kind to myself and others while pursuing my dreams",
  "I am thankful for my health, my loved ones, and this fresh start",
  "Every sunrise is a reminder that I can begin again with renewed purpose",
];

// Helper function to truncate long addresses
const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4) => {
  if (address.length <= startLength + endLength + 3) {
    return address; // Address is short enough, no need to truncate
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export function Alarm({ id }: { id: string }) {
  const alarmPackageId = useNetworkVariable("alarmPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  const [waitingForTxn, setWaitingForTxn] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSentence, setVerificationSentence] = useState("");
  const [userInput, setUserInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCompleteAlarm = () => {
    // Only "Wake Up Early" challenges require sentence verification
    if (alarmData?.habit_type === "Wake Up Early") {
      // Show verification step with random positive sentence
      const randomSentence = WAKE_UP_SENTENCES[Math.floor(Math.random() * WAKE_UP_SENTENCES.length)];
      setVerificationSentence(randomSentence);
      setShowVerification(true);
      setUserInput("");
      setInputError("");
    } else {
      // For other habit types, complete directly without verification
      executeMoveCall("complete");
    }
  };

  const submitVerification = () => {
    // Check if user typed the sentence correctly (case insensitive, ignoring extra spaces)
    const userInputClean = userInput.trim().toLowerCase().replace(/\s+/g, ' ');
    const expectedClean = verificationSentence.toLowerCase().replace(/\s+/g, ' ');
    
    if (userInputClean !== expectedClean) {
      setInputError("Please type the sentence exactly as shown above.");
      return;
    }

    // Sentence is correct, proceed with blockchain transaction
    executeMoveCall("complete");
    setShowVerification(false);
  };

  const executeMoveCall = (method: "complete" | "fail" | "cancel") => {
    setWaitingForTxn(method);

    const tx = new Transaction();

    // Get the clock object (0x6 is the clock object in Sui)
    const clock = tx.object("0x6");

    if (method === "complete") {
      tx.moveCall({
        arguments: [tx.object(id), clock],
        target: `${alarmPackageId}::alarm::complete_alarm`,
      });
    } else if (method === "fail") {
      tx.moveCall({
        arguments: [tx.object(id), clock],
        target: `${alarmPackageId}::alarm::fail_alarm`,
      });
    } else if (method === "cancel") {
      tx.moveCall({
        arguments: [tx.object(id)],
        target: `${alarmPackageId}::alarm::cancel_alarm`,
      });
    }

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            await refetch();
            setWaitingForTxn("");
          });
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          setWaitingForTxn("");
          alert("Transaction failed. Please try again.");
        },
      },
    );
  };

  if (isPending) return (
    <Alert className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <AlertDescription className="text-muted-foreground dark:text-gray-400">Loading...</AlertDescription>
    </Alert>
  );

  if (error) return (
    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <AlertDescription className="text-red-700 dark:text-red-300">Error: {error.message}</AlertDescription>
    </Alert>
  );

  if (!data.data) return (
    <Alert className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <AlertDescription className="text-muted-foreground dark:text-gray-400">Not found</AlertDescription>
    </Alert>
  );

  const alarmData = getAlarmFields(data.data);
  if (!alarmData) return (
    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <AlertDescription className="text-red-700 dark:text-red-300">Invalid alarm data</AlertDescription>
    </Alert>
  );

  const ownedByCurrentAccount = alarmData.owner === currentAccount?.address;
  const wakeUpTime = new Date(parseInt(alarmData.wake_up_time));
  const depositInSUI = parseInt(alarmData.deposit_amount) / 1_000_000_000;
  const isExpired = currentTime >= parseInt(alarmData.wake_up_time);
  const canComplete = isExpired && alarmData.is_active && !alarmData.is_completed;
  const gracePeriodEnd = parseInt(alarmData.wake_up_time) + (60 * 60 * 1000); // 1 hour grace period
  const canFail = currentTime >= gracePeriodEnd && alarmData.is_active && !alarmData.is_completed;
  const isFailable = currentTime >= gracePeriodEnd;

  const getStatusColor = () => {
    if (alarmData.is_completed) {
      return ownedByCurrentAccount && !isFailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    }
    if (!alarmData.is_active) return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    if (canFail) return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
    if (canComplete) return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
    return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
  };

  const getStatusText = () => {
    if (alarmData.is_completed) {
      if (ownedByCurrentAccount && !isFailable) return "✅ Completed Successfully";
      return "❌ Failed - Donated to Charity";
    }
    if (!alarmData.is_active) return "Cancelled";
    if (canFail) return "Failed - Can Donate to Charity";
    if (canComplete) return "Ready to Complete!";
    if (isExpired) return "Expired - Grace Period";
    return "Active - Waiting";
  };

  const timeUntilAlarm = parseInt(alarmData.wake_up_time) - currentTime;
  const timeDisplay = timeUntilAlarm > 0 
    ? `${Math.floor(timeUntilAlarm / (1000 * 60 * 60))}h ${Math.floor((timeUntilAlarm % (1000 * 60 * 60)) / (1000 * 60))}m remaining`
    : "Time has passed!";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-black">
              {alarmData.habit_type} Challenge
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-200">
              Time: {wakeUpTime.toLocaleString()}
            </CardDescription>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Alarm Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Habit Type</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{alarmData.habit_type}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Deposit Amount</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{depositInSUI.toFixed(2)} SUI</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">❤️ Charity</div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded flex-1 break-all text-gray-900 dark:text-white transition-colors duration-200" title={alarmData.charity_address}>
                {truncateAddress(alarmData.charity_address)}
              </div>
              <Button
                onClick={() => copyToClipboard(alarmData.charity_address)}
                variant="outline"
                size="sm"
                className="px-2 py-1 h-8 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 transition-colors duration-200"
                title="Copy full address"
              >
                {copySuccess ? (
                  <span className="text-green-600 dark:text-green-400">✓</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">📋</span>
                )}
              </Button>
            </div>
            {copySuccess && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium transition-colors duration-200">
                ✓ Address copied to clipboard!
              </div>
            )}
          </div>
        </div>

        {/* Time Display */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
          <div className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors duration-200">
            {!alarmData.is_completed && alarmData.is_active ? timeDisplay : ""}
          </div>
        </div>

        {/* Wake-up Verification Section - Only for "Wake Up Early" challenges */}
        {showVerification && (
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl transition-colors duration-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-black mb-2">🌅 Prove You're Awake!</h3>
              <p className="text-black mb-4">
                To complete your alarm and get your deposit back, please type the following positive sentence exactly:
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-400 dark:border-green-500 mb-4 transition-colors duration-200">
              <p className="font-medium text-gray-800 dark:text-white text-center italic transition-colors duration-200">
                "{verificationSentence}"
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Type the sentence exactly as shown above..."
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setInputError(""); // Clear error when user types
                }}
                className={`w-full p-3 text-lg transition-colors duration-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${
                  inputError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
                }`}
              />
              
              {inputError && (
                <Alert className="border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 transition-colors duration-200">
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {inputError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={submitVerification}
                  disabled={!userInput.trim() || waitingForTxn !== ""}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 text-lg rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {waitingForTxn === "complete" ? (
                    <ClipLoader size={20} color="white" />
                  ) : (
                    "Complete Alarm"
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setShowVerification(false);
                    setUserInput("");
                    setInputError("");
                  }}
                  variant="outline"
                  disabled={waitingForTxn !== ""}
                  className="px-6 py-2 text-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {ownedByCurrentAccount && (
          <div className="flex flex-wrap gap-3 justify-center">
            {canComplete && !showVerification && !canFail && (
              <Button
                onClick={handleCompleteAlarm}
                disabled={waitingForTxn !== ""}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {waitingForTxn === "complete" ? (
                  <ClipLoader size={20} color="white" />
                ) : (
                  "Mark as Completed"
                )}
              </Button>
            )}
            
            {alarmData.is_active && !alarmData.is_completed && !canComplete && (
              <Button
                onClick={() => executeMoveCall("cancel")}
                disabled={waitingForTxn !== ""}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {waitingForTxn === "cancel" ? (
                  <ClipLoader size={20} color="white" />
                ) : (
                  "Cancel Alarm (10% fee)"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Anyone can trigger fail after grace period */}
        {canFail && (
          <div className="text-center">
            <Button
              onClick={() => executeMoveCall("fail")}
              disabled={waitingForTxn !== ""}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {waitingForTxn === "fail" ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Mark as Failed (Send to Charity)"
              )}
            </Button>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 rounded transition-colors duration-200">
          <div className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-200">
            {alarmData.is_completed ? (
              <p>
                <strong>Completed:</strong> This alarm challenge is finished.
                {ownedByCurrentAccount && !isFailable ? " You got your deposit back!" : " The deposit went to charity."}
              </p>
            ) : alarmData.is_active ? (
              <p>
                <strong>Active Alarm:</strong> You have until {new Date(gracePeriodEnd).toLocaleString()} 
                to mark this alarm as completed, or the deposit will go to charity.
              </p>
            ) : (
              <p><strong>Cancelled:</strong> This alarm was cancelled and 90% of the deposit was refunded.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAlarmFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  return data.content.fields as {
    owner: string;
    habit_type: string;
    wake_up_time: string;
    deposit_amount: string;
    charity_address: string;
    is_active: boolean;
    is_completed: boolean;
  };
}