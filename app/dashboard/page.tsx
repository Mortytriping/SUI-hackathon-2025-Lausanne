"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkVariable } from "@/networkConfig";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export default function Dashboard() {
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  const account = useCurrentAccount();
  
  const alarmPackageId = useNetworkVariable("alarmPackageId");
  
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalCompleted: 0,
    totalFailed: 0,
    successRate: 0
  });

  useEffect(() => {
    if (!account?.address) return;

    const fetchEvents = async () => {
      try {
        const events = await client.queryEvents({
          query: { MoveEventModule: { package: alarmPackageId, module: "alarm" } },
          order: "descending",
        });
        console.log("Total events found:", events.data.length);
        
        // Log each event to see the structure
        events.data.forEach((event, index) => {
          console.log(`Event ${index}:`, event);
          console.log(`Parsed JSON ${index}:`, event.parsedJson);
        });

        // Filter according to wallet
        const filtered = events.data
          .map((ev) => ev.parsedJson)
          .filter((ev: any) => {
            console.log("Checking event:", ev);
            console.log("Event owner:", ev?.owner);
            console.log("Account address:", account.address);
            console.log("Match:", ev?.owner === account.address);
            return ev?.owner === account.address;
          });
        
        console.log("Filtered events:", filtered);
        
        // Calculate statistics
        const createdEvents = filtered.filter((ev: any) => ev.habit_type); // AlarmCreated has habit_type
        const completedEvents = filtered.filter((ev: any) => !ev.habit_type && !ev.charity_address); // AlarmCompleted
        const failedEvents = filtered.filter((ev: any) => ev.charity_address && ev.amount); // AlarmFailed
        
        const totalFinished = completedEvents.length + failedEvents.length;
        const successRate = totalFinished > 0 ? (completedEvents.length / totalFinished) * 100 : 0;
        
        setStats({
          totalCreated: createdEvents.length,
          totalCompleted: completedEvents.length,
          totalFailed: failedEvents.length,
          successRate: Math.round(successRate)
        });
        
        // Show recent activities (last 5)
        setActivities(filtered.slice(0, 5));
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, [account]);

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
              Total Alarms Created
            </CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              {stats.totalCreated}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">
              Habit challenges started
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
              Completed Successfully
            </CardTitle>
            <div className="text-2xl">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-200">
              {stats.totalCompleted}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
              Failed Attempts
            </CardTitle>
            <div className="text-2xl">❌</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors duration-200">
              {stats.totalFailed}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">
              Donations to charity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
              Success Rate
            </CardTitle>
            <div className="text-2xl">📈</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">
              {stats.successRate}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">
              {stats.totalCompleted + stats.totalFailed > 0 ? 'Achievement rate' : 'No completed alarms yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((event, i) => {
                  // Determine event type and display info
                  const eventType = event.alarm_id ? 
                    (event.habit_type ? "Created" : 
                     event.charity_address ? "Failed" : "Completed") : "Unknown";
                  
                  const isSuccess = eventType === "Completed";
                  const isFailed = eventType === "Failed";
                  
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-4 rounded-lg border transition-colors duration-200 ${
                        isSuccess 
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                          : isFailed 
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-black mb-1">
                          {event.habit_type || "Alarm"} - {eventType}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-200">
                          {event.wake_up_time ? new Date(parseInt(event.wake_up_time)).toLocaleString() : "Recent"} —{" "}
                          {isSuccess ? "Success ✅" : isFailed ? "Failed ❌" : "Created 🎯"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                          ID: {event.alarm_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-semibold text-lg ${
                            isSuccess 
                              ? "text-green-600 dark:text-green-400" 
                              : isFailed 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {event.deposit_amount ? `${(parseInt(event.deposit_amount) / 1_000_000_000).toFixed(2)} SUI` : 
                           event.amount ? `${(parseInt(event.amount) / 1_000_000_000).toFixed(2)} SUI` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recent activity yet. Create your first alarm to get started!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}