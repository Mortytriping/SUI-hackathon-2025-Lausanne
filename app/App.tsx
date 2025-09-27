'use client'
import { useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { useState, useEffect } from "react";
import { Alarm } from "./Alarm";
import { CreateAlarm } from "./CreateAlarm";
import { AlarmList } from "./components/AlarmList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function App() {
  const currentAccount = useCurrentAccount();
  const [alarmId, setAlarm] = useState<string | null>(null);
  const [view, setView] = useState<'create' | 'search' | 'alarm'>('create');

  useEffect(() => {
    const hash = window.location.hash;
    if (isValidSuiObjectId(hash)) {
      setAlarm(hash);
      setView('alarm');
    }
  }, []);

  const handleAlarmCreated = (id: string) => {
    window.location.hash = id;
    setAlarm(id);
    setView('alarm');
  };

  const handleAlarmSelected = (id: string) => {
    window.location.hash = id;
    setAlarm(id);
    setView('alarm');
  };

  const goBackToSelection = () => {
    setAlarm(null);
    setView('create');
    window.location.hash = '';
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="min-h-[500px]">
        <CardContent className="pt-6">
          {currentAccount ? (
            alarmId ? (
              <div className="space-y-4">
                {/* Back button when viewing an alarm */}
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={goBackToSelection}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ← Back to Alarm Selection
                  </Button>
                  <div className="text-sm text-gray-500">
                    Alarm ID: {alarmId}
                  </div>
                </div>
                
                {/* Alarm component */}
                <Alarm id={alarmId} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Navigation with proper styling */}
                <div className="flex justify-center space-x-4">
                  <Button
                    variant={view === 'create' ? 'default' : 'outline'}
                    onClick={() => setView('create')}
                    className={view === 'create' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  >
                    Create New Alarm
                  </Button>
                  <Button
                    variant={view === 'search' ? 'default' : 'outline'}
                    onClick={() => setView('search')}
                    className={view === 'search' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  >
                    Find Existing Alarms
                  </Button>
                </div>

                {/* Content based on view */}
                {view === 'create' && (
                  <CreateAlarm onCreated={handleAlarmCreated} />
                )}
                
                {view === 'search' && (
                  <AlarmList onSelectAlarm={handleAlarmSelected} />
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Wake Up Challenge</h2>
              <p className="text-gray-600 mb-4">Set wake-up alarms with financial stakes to help you build better habits!</p>
              <p className="text-gray-500">Please connect your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
