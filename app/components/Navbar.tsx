"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Section Logo et titre */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="hover:scale-105 transition-transform duration-200">
          <img 
            src="/logo.png"
            alt="Logo" 
            className="h-16 w-20 cursor-pointer"
          />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          On Chain Habit 
        </h1>
      </div>

      {/* Section centrale avec navigation */}
      <div className="flex items-center space-x-6">
        <Link 
          href="/" 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105 transition-all duration-200 font-medium"
        >
          Home
        </Link>
        <Link 
          href="/dashboard" 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105 transition-all duration-200 font-medium"
        >
          Dashboard
        </Link>
      </div>

      {/* Section Wallet + Theme à droite */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </nav>
  );
}