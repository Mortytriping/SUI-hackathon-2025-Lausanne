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

  useEffect(() => {
    if (!account?.address) return;

    const fetchEvents = async () => {
      try {
        const events = await client.queryEvents({
          query: { MoveEventModule: { package: alarmPackageId, module: "alarm" } },
          limit: 3,
          order: "descending",
        });

        // Filtrer selon le wallet
        const filtered = events.data
          .map((ev) => ev.parsedJson)
          .filter((ev: any) => ev?.owner === account.address) // ton champ "owner"
          .slice(0, 3);

        setActivities(filtered);
      } catch (err) {
        console.error("Erreur fetch events:", err);
      }
    };

    fetchEvents();
  }, [account]);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🕐 Recent Alarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((act, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      act.success ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{act.label || "Alarm"}</p>
                      <p className="text-sm text-gray-600">
                        {act.time || "??"} – {act.success ? "Success ✅" : "Failed ❌"}
                      </p>
                    </div>
                    <span
                      className={`font-semibold ${
                        act.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {act.amount ? `${act.success ? "+" : "-"}${act.amount} SUI` : "?"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}