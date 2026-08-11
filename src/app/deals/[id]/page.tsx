"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Tornado, ArrowLeft, ArrowLeftRight, Building2, ShieldCheck, 
  CheckCircle2, Send, DollarSign, FileText, Sparkles, MessageSquare, ExternalLink, Play
} from "lucide-react";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealRoomPage({ params }: DealPageProps) {
  const { id: dealId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    async function loadDealRoom() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      setCurrentUserId(session.user.id);

      // 1. Fetch Barter Deal Data with related offers and companies
      const { data: dealData, error } = await supabase
        .from("barter_deals")
        .select(`
          *,
          offer_a:trade_offers!offer_a_id(*, companies(*)),
          offer_b:trade_offers!offer_b_id(*, companies(*))
        `)
        .eq("id", dealId)
        .single();

      if (error || !dealData) {
        // Fallback for mock/simulation deals
        setDeal({
          id: dealId,
          company_a_id: session.user.id,
          status: "proposal_pending",
          signed_a: false,
          signed_b: false,
          offer_a: {
            title: "50 Hours Studio Video Production",
            offering_summary: "4K Multi-cam filming & editing",
            looking_for_summary: "Downtown Coworking Desks / Office Lease",
            estimated_value: 5000,
            video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
            companies: { name: "Montreal Creative Studios", location_name: "Montreal, QC" }
          },
          offer_b: {
            title: "200 Sq Ft Downtown Office Lease Space",
            offering_summary: "Furnished workspace near Mile End with gigabit fiber",
            looking_for_summary: "Video Production & Marketing Reels",
            estimated_value: 4800,
            video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
            companies: { name: "St-Laurent Tech Hub", location_name: "Montreal, QC" }
          }
        });
      } else {
        setDeal(dealData);
      }

      // 2. Fetch Chat Messages
      fetchMessages();

      // 3. Subscribe to Real-time Messages
      const channel = supabase
        .channel(`deal-${dealId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${dealId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
      };
    }

    loadDealRoom();
  }, [dealId, router]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("deal_messages")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_company_id: currentUserId,
      content: newMessage.trim()
    });

    if (!error) {
      setNewMessage("");
    }
  };

  const handleSignAgreement = async () => {
    setSigning(true);
    const isUserA = deal.company_a_id === currentUserId;
    
    const updates = isUserA 
      ? { signed_a: true, status: deal.signed_b ? "executed" : "partially_signed" }
      : { signed_b: true, status: deal.signed_a ? "executed" : "partially_signed" };

    const { error } = await supabase
      .from("barter_deals")
      .update(updates)
      .eq("id", dealId);

    if (!error) {
      setDeal((prev: any) => ({ ...prev, ...updates }));
    }
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="text-sm font-medium text-slate-400">Loading Secure Deal Room Environment...</p>
      </div>
    );
  }

  const valueA = deal?.offer_a?.estimated_value || 0;
  const valueB = deal?.offer_b?.estimated_value || 0;
  const parityDiff = Math.abs(valueA - valueB);
  const isExecuted = deal?.signed_a && deal?.signed_b;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard")} 
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Tornado className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-extrabold text-white text-sm">
              DEAL ROOM <span className="text-slate-500">#{dealId.slice(0, 8)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isExecuted 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {isExecuted ? "OFFICIALLY EXECUTED" : "NEGOTIATION IN PROGRESS"}
          </span>

          <Button 
            onClick={handleSignAgreement} 
            disabled={signing || (deal.company_a_id === currentUserId ? deal.signed_a : deal.signed_b)}
            className={`text-xs font-bold px-4 h-9 ${
              isExecuted 
                ? "bg-emerald-600 text-white" 
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
            }`}
          >
            {signing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {isExecuted ? "Contract Active" : "Sign Barter Agreement"}
          </Button>
        </div>
      </header>

      {/* Main Deal Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Side-by-Side Video Pitch Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Valuation Parity Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Valuation Parity Check</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  Equity Difference: <span className="text-emerald-400">${parityDiff.toLocaleString()} CAD</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Cash Outlay Trade</span>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-Side Pitch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Party A Offer */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="aspect-video bg-slate-950 relative">
                <video src={deal?.offer_a?.video_url} controls className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                  ${valueA.toLocaleString()} CAD
                </span>
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase">{deal?.offer_a?.companies?.name}</p>
                <h4 className="text-sm font-bold text-white line-clamp-1">{deal?.offer_a?.title}</h4>
                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p><strong className="text-slate-500">Gives:</strong> {deal?.offer_a?.offering_summary}</p>
                  <p><strong className="text-slate-500">Wants:</strong> {deal?.offer_a?.looking_for_summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Party B Offer */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="aspect-video bg-slate-950 relative">
                <video src={deal?.offer_b?.video_url} controls className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                  ${valueB.toLocaleString()} CAD
                </span>
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase">{deal?.offer_b?.companies?.name}</p>
                <h4 className="text-sm font-bold text-white line-clamp-1">{deal?.offer_b?.title}</h4>
                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p><strong className="text-slate-500">Gives:</strong> {deal?.offer_b?.offering_summary}</p>
                  <p><strong className="text-slate-500">Wants:</strong> {deal?.offer_b?.looking_for_summary}</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Contract Execution Status */}
          <Card className="bg-slate-900 border-slate-800 p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Digital Signature Status</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                deal?.signed_a ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{deal?.offer_a?.companies?.name}: {deal?.signed_a ? "Signed" : "Pending Signature"}</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                deal?.signed_b ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{deal?.offer_b?.companies?.name}: {deal?.signed_b ? "Signed" : "Pending Signature"}</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column: Real-time Negotiation Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-500" />
              Live Terms Negotiation
            </span>
            <span className="text-[10px] text-slate-500">Encrypted P2P Stream</span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <Sparkles className="w-6 h-6 mb-2 opacity-40 text-red-500" />
                <p>No messages yet. Confirm delivery timing or asset specifications below.</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_company_id === currentUserId;
                return (
                  <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-xs ${
                      isMe 
                        ? "bg-red-600 text-white rounded-br-none" 
                        : "bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Offer Presets & Input Form */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button 
                type="button" 
                onClick={() => setNewMessage("I agree to equal valuation parity. Ready to sign.")}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md whitespace-nowrap"
              >
                "Ready to sign"
              </button>
              <button 
                type="button" 
                onClick={() => setNewMessage("Can we adjust delivery schedule to 14 days?")}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md whitespace-nowrap"
              >
                "14 days timeline?"
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                placeholder="Type message or terms proposal..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
              <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-500 text-white h-9 px-3">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}