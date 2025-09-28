"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit"; // hook pour wallet connecté
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
    <div className="container mx-auto p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alarms Created</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreated}</div>
            <p className="text-xs text-muted-foreground">
              Habit challenges started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Successfully</CardTitle>
            <div className="text-2xl">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
            <p className="text-xs text-muted-foreforeground">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <div className="text-2xl">❌</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
            <p className="text-xs text-muted-foreground">
              Donations to charity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <div className="text-2xl">�</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompleted + stats.totalFailed > 0 ? 'Achievement rate' : 'No completed alarms yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🕐 Recent Activity</CardTitle>
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
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        isSuccess ? "bg-green-50" : isFailed ? "bg-red-50" : "bg-blue-50"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          🎯 {event.habit_type || "Alarm"} - {eventType}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.wake_up_time ? new Date(parseInt(event.wake_up_time)).toLocaleString() : "Recent"} –{" "}
                          {isSuccess ? "Success ✅" : isFailed ? "Failed ❌" : "Created 🎯"}
                        </p>
                        <p className="text-xs text-gray-500">ID: {event.alarm_id}</p>
                      </div>
                      <span
                        className={`font-semibold ${
                          isSuccess ? "text-green-600" : isFailed ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {event.deposit_amount ? `${(parseInt(event.deposit_amount) / 1_000_000_000).toFixed(2)} SUI` : 
                         event.amount ? `${(parseInt(event.amount) / 1_000_000_000).toFixed(2)} SUI` : ""}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No recent activity yet. Create your first alarm to get started!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}