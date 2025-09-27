"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Dashboard</h1>
        <p className="text-gray-600">Monitor your alarm performance and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:scale-105 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Alarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 mt-1">+2 this week</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">85%</div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">SUI Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">24.5</div>
            <p className="text-xs text-gray-500 mt-1">Total recovered</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">7 days</div>
            <p className="text-xs text-green-600 mt-1">Personal best!</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🕐 Recent Alarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Morning Workout</p>
                  <p className="text-sm text-gray-600">06:00 AM - Success ✅</p>
                </div>
                <span className="text-green-600 font-semibold">+2.5 SUI</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Early Start</p>
                  <p className="text-sm text-gray-600">05:30 AM - Failed ❌</p>
                </div>
                <span className="text-red-600 font-semibold">-1.0 SUI</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Weekend Challenge</p>
                  <p className="text-sm text-gray-600">07:00 AM - Success ✅</p>
                </div>
                <span className="text-green-600 font-semibold">+0.5 SUI</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 hover:scale-105 transition-all">
                <p className="font-medium text-blue-900">Create New Alarm</p>
                <p className="text-sm text-blue-600">Set up your next challenge</p>
              </button>
              
              <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 hover:scale-105 transition-all">
                <p className="font-medium text-purple-900">View All Alarms</p>
                <p className="text-sm text-purple-600">Manage your challenges</p>
              </button>
              
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 hover:scale-105 transition-all">
                <p className="font-medium text-green-900">Export Data</p>
                <p className="text-sm text-green-600">Download your statistics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}