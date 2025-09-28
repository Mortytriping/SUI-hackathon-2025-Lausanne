"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Section Logo et titre */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="hover:scale-105 transition-transform duration-200">
          <img 
            src="/logo.png"
            alt="Logo" 
            className="h-16 w-20 cursor-pointer"
          />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">
          On Chain Habit 
        </h1>
      </div>

      {/* Section centrale avec navigation */}
      <div className="flex items-center space-x-6">
        <Link 
          href="/" 
          className="text-gray-600 hover:text-gray-900 hover:scale-105 transition-all duration-200 font-medium"
        >
          🏠 Home
        </Link>
        <Link 
          href="/dashboard" 
          className="text-gray-600 hover:text-gray-900 hover:scale-105 transition-all duration-200 font-medium"
        >
          📊 Dashboard
        </Link>
      </div>

      {/* Section Wallet à droite */}
      <div className="flex items-center">
        <ConnectButton />
      </div>
    </nav>
  );
}