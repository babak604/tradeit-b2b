"use client";

import React, { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

export function NetworkWarningBanner() {
  const { connection } = useConnection();
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>("");

  useEffect(() => {
    if (connection) {
      const endpoint = connection.rpcEndpoint;
      setRpcEndpoint(endpoint);
      
      // Check if endpoint or cluster points to mainnet
      const mainnetDetected = 
        endpoint.includes("mainnet") && 
        !endpoint.includes("devnet") && 
        !endpoint.includes("testnet");

      setIsMainnet(mainnetDetected);
    }
  }, [connection]);

  if (!isMainnet) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-semibold text-amber-300">Phantom Network Alert</h4>
          <p className="text-sm opacity-90">
            Your wallet is currently connected to <strong>Mainnet Beta</strong> ({rpcEndpoint}). Please switch Phantom to <strong>Solana Devnet</strong> in <em>Settings &gt; Developer Settings</em> to test escrow vaults safely.
          </p>
        </div>
      </div>
    </div>
  );
}