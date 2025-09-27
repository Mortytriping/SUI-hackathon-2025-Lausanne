"use client";

import * as React from "react";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Section Logo */}
      <div className="flex items-center space-x-3">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-8 w-8"
        />
      </div>

      {/* Titre de l'app au centre */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Wake or stake !
        </h1>
      </div>

      {/* Section Wallet à droite */}
      <div className="flex items-center">
        <ConnectButton />
      </div>
    </nav>
  );
}