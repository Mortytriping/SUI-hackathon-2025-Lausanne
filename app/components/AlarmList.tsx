'use client'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AlarmData {
  objectId: string;
  wake_up_time: string;
  deposit_amount: string;
  charity_address: string;
  owner: string;
  is_active: boolean;
  is_completed: boolean;
}

function getAlarmFields(data: any): AlarmData | null {
  if (data?.content?.dataType !== "moveObject") {
    return null;
  }
  const fields = data.content.fields;
  return {
    objectId: data.objectId,
    wake_up_time: fields.wake_up_time,
    deposit_amount: fields.deposit_amount,
    charity_address: fields.charity_address,
    owner: fields.owner,
    is_active: fields.is_active,
    is_completed: fields.is_completed,
  };
}

export function AlarmList({ onSelectAlarm }: { onSelectAlarm: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AlarmData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAlarms = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Search by object ID if it's a valid Sui object ID
      if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
        // Create Sui client and query directly
        const client = new SuiClient({ url: getFullnodeUrl("testnet") });
        
        const object = await client.getObject({
          id: searchQuery,
          options: {
            showContent: true,
            showOwner: true,
            showType: true,
          },
        });

        if (object.data && object.data.content?.dataType === "moveObject") {
          const alarmData = getAlarmFields(object.data);
          if (alarmData) {
            setSearchResults([alarmData]);
          } else {
            setError("Object found but is not an alarm");
          }
        } else {
          setError("Object not found or invalid");
        }
      } else {
        setError("Please enter a valid Sui object ID (starts with 0x and is 66 characters long)");
      }
    } catch (err) {
      setError("Error searching for alarms");
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  const formatSUI = (amount: string) => {
    return (parseInt(amount) / 1_000_000_000).toFixed(2);
  };

  const getStatusDisplay = (alarm: AlarmData) => {
    const now = Date.now();
    const wakeUpTime = parseInt(alarm.wake_up_time);
    
    if (alarm.is_completed) {
      return { text: "Completed", color: "text-green-600 bg-green-100" };
    }
    if (!alarm.is_active) {
      return { text: "Cancelled", color: "text-gray-600 bg-gray-100" };
    }
    if (now > wakeUpTime + 3600000) { // 1 hour past wake up time
      return { text: "Failed", color: "text-red-600 bg-red-100" };
    }
    if (now > wakeUpTime) {
      return { text: "Grace Period", color: "text-yellow-600 bg-yellow-100" };
    }
    return { text: "Active", color: "text-blue-600 bg-blue-100" };
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Existing Alarms</h2>
        <p className="text-gray-600 mb-6">
          Search for existing alarm objects by their Object ID
        </p>
      </div>

      {/* Search by Object ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Search by Object ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter alarm object ID (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <Button 
              onClick={searchAlarms}
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((alarm) => {
                const status = getStatusDisplay(alarm);
                return (
                  <div key={alarm.objectId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">⏰ {formatTime(alarm.wake_up_time)}</p>
                        <p className="text-sm text-gray-600">💰 Deposit: {formatSUI(alarm.deposit_amount)} SUI</p>
                        <p className="text-sm text-gray-600">👤 Owner: {alarm.owner}</p>
                        <p className="text-xs text-gray-500">🆔 ID: {alarm.objectId}</p>
                      </div>
                      <Button 
                        onClick={() => onSelectAlarm(alarm.objectId)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        View Alarm
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      ❤️ Charity: {alarm.charity_address}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-2 text-gray-900">How to find alarm object IDs:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Create an alarm first to get its object ID</li>
              <li>Copy the object ID from the URL hash after creating an alarm</li>
              <li>Or check the Sui Explorer for your package transactions</li>
              <li>Look for objects of type: <code className="bg-gray-100 px-1 rounded text-gray-800">Alarm</code></li>
              <li>Object IDs are 66 characters long and start with "0x"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
