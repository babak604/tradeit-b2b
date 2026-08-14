export interface DealLogEvent {
  id?: string;
  dealId: string;
  eventType: string;
  txSignature: string;
  walletAddress: string;
  mintAddress?: string;
  recipientAddress?: string;
  amount?: number;
  createdAt?: string;
}

export function downloadDealReceiptJSON(dealId: string, logs: any[]) {
  const receiptData = {
    dealId,
    exportedAt: new Date().toISOString(),
    network: "Solana Devnet",
    totalEvents: logs.length,
    events: logs,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(receiptData, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `Escrow_Audit_Receipt_${dealId}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}