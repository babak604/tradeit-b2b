'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './ToastProvider';

interface RealtimeDealListenerProps {
  companyId: string;
}

export function RealtimeDealListener({ companyId }: RealtimeDealListenerProps) {
  const { addToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!companyId) return;

    // 1. Subscribe to Deal State Updates
    const dealsChannel = supabase
      .channel('global-deals-listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deals',
        },
        (payload: any) => {
          const newDeal = payload.new;
          
          // Check if user's company is involved in this deal
          if (
            newDeal.initiator_company_id === companyId ||
            newDeal.counterparty_company_id === companyId
          ) {
            if (newDeal.status === 'settled') {
              addToast({
                type: 'settlement',
                title: 'Escrow Settled! 🎉',
                message: `Deal #${newDeal.id.slice(0, 8)} has been finalized and credits have been released.`,
                link: `/deals/${newDeal.id}`,
              });
            } else if (newDeal.status === 'active') {
              addToast({
                type: 'deal_update',
                title: 'Deal Terms Signed ✍️',
                message: `Both parties signed terms for Deal #${newDeal.id.slice(0, 8)}. Escrow is now active.`,
                link: `/deals/${newDeal.id}`,
              });
            } else {
              addToast({
                type: 'deal_update',
                title: 'Deal Status Changed',
                message: `Status updated to ${newDeal.status.toUpperCase()} for Deal #${newDeal.id.slice(0, 8)}.`,
                link: `/deals/${newDeal.id}`,
              });
            }
          }
        }
      )
      // 2. Subscribe to Incoming Messages in Active Deals
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
        },
        (payload: any) => {
          const newMessage = payload.new;

          // Don't toast if the message originated from our own company
          if (newMessage.sender_company_id !== companyId) {
            addToast({
              type: 'message',
              title: 'New Negotiation Message',
              message: newMessage.content 
                ? `${newMessage.content.slice(0, 60)}${newMessage.content.length > 60 ? '...' : ''}`
                : 'Attachment shared in deal room.',
              link: `/deals/${newMessage.deal_id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
    };
  }, [companyId, addToast, supabase]);

  return null;
}