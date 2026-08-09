import os
import uuid
import json
import urllib.request
import pandas as pd
import streamlit as st
from supabase import create_client

# Try importing OpenAI, fail gracefully if not installed
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# -----------------------------------------------------------------------------
# 1. PAGE CONFIGURATION & CREDENTIALS
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="TradeIt - B2B Barter Marketplace",
    page_icon="🤝",
    layout="wide"
)

HARDCODED_SUPABASE_URL = "https://udwmxzbpmkhimzctoemg.supabase.co"
HARDCODED_SUPABASE_KEY = ""

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
    load_dotenv()
except ImportError:
    pass

def fetch_secret(key_name):
    try:
        if hasattr(st, "secrets") and key_name in st.secrets:
            return st.secrets[key_name]
    except Exception:
        pass
    return os.getenv(key_name)

SUPABASE_URL = fetch_secret("SUPABASE_URL") or fetch_secret("NEXT_PUBLIC_SUPABASE_URL") or HARDCODED_SUPABASE_URL
SUPABASE_KEY = fetch_secret("SUPABASE_KEY") or fetch_secret("SUPABASE_ANON_KEY") or fetch_secret("NEXT_PUBLIC_SUPABASE_ANON_KEY") or HARDCODED_SUPABASE_KEY
OPENAI_API_KEY = fetch_secret("OPENAI_API_KEY")

if not SUPABASE_KEY:
    st.error("⚠️ **Supabase Anon Key missing!**")
    st.info("Please add `SUPABASE_KEY` to your Streamlit Cloud Secrets or local configuration.")
    st.stop()

@st.cache_resource
def get_supabase_client():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase_client()

if "user" not in st.session_state:
    st.session_state.user = None


# -----------------------------------------------------------------------------
# 2. HELPER FUNCTIONS FOR AI, STORAGE, MEDIA, WEBHOOKS & CHAT
# -----------------------------------------------------------------------------
def get_ai_deal_appraisal(offered_title, offered_desc, target_title, target_desc):
    """Calls the LLM to generate an objective fair market valuation for a barter trade."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        return "⚠️ OpenAI API key or package missing. Please configure OPENAI_API_KEY to enable AI Appraisals."
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        prompt = f"""
        You are an expert B2B business appraiser and mediator based in Canada. 
        Analyze this proposed barter trade objectively:
        
        PARTY A OFFERS: {offered_title}
        Description: {offered_desc}
        
        PARTY B OFFERS (TARGET): {target_title}
        Description: {target_desc}
        
        Provide a concise, highly professional 3-paragraph appraisal formatted in Markdown:
        1. **Valuation A:** Estimated standard market value of Party A's offer in CAD (give a realistic range based on B2B industry standards).
        2. **Valuation B:** Estimated standard market value of Party B's offer in CAD.
        3. **Mediator's Verdict:** A conclusion on the fairness of the swap, and a specific recommended Cash Top-Up amount (and who should pay it) to balance the deal fairly. Do not use pleasantries, just deliver the appraisal.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating AI appraisal: {e}"

def upload_file_to_supabase(uploaded_file, user_id, folder="media"):
    try:
        file_bytes = uploaded_file.getvalue()
        file_ext = uploaded_file.name.split(".")[-1].lower()
        file_path = f"{folder}/{user_id}/{uuid.uuid4().hex}.{file_ext}"

        supabase.storage.from_("barter-media").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": uploaded_file.type}
        )
        return supabase.storage.from_("barter-media").get_public_url(file_path)
    except Exception as e:
        st.error(f"Error uploading file: {e}")
        return None

def render_media(url, width=350):
    if not url:
        return
    video_exts = [".mp4", ".mov", ".webm", ".m4v", ".mkv"]
    if any(ext in url.lower() for ext in video_exts):
        st.video(url)
    else:
        st.image(url, width=width)

def trigger_webhook(user_id, event_type, payload):
    try:
        prof_res = supabase.table("profiles").select("webhook_url").eq("id", user_id).execute()
        if prof_res.data and prof_res.data[0].get("webhook_url"):
            webhook_url = prof_res.data[0]["webhook_url"]
            full_payload = {"event": event_type, "data": payload}
            req = urllib.request.Request(
                webhook_url,
                data=json.dumps(full_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass

def send_notification(user_id, title, message):
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message
        }).execute()
        trigger_webhook(user_id, "notification_received", {"title": title, "message": message})
    except Exception:
        pass

def render_chat_window(proposal_id, user_id, recipient_id):
    try:
        msgs_res = supabase.table("messages").select("*, sender:profiles(business_name)").eq("proposal_id", proposal_id).order("created_at", asc=True).execute()
        messages = msgs_res.data or []

        st.markdown("#### 💬 Partner Messages & Updates")
        chat_container = st.container(height=220, border=True)
        with chat_container:
            if not messages:
                st.caption("No messages yet. Send a note below to schedule deliverables.")
            for msg in messages:
                sender_name = (msg.get("sender") or {}).get("business_name") or "User"
                is_me = (msg["sender_id"] == user_id)
                prefix = "👤 **You**" if is_me else f"🏢 **{sender_name}**"
                time_str = msg['created_at'][11:16] if len(msg.get('created_at', '')) >= 16 else ""
                st.markdown(f"{prefix} *({time_str})*")
                st.write(msg["content"])
                st.divider()

        with st.form(key=f"msg_form_{proposal_id}", clear_on_submit=True):
            new_msg = st.text_input("Type your message...", placeholder="e.g. Let's confirm kick-off details...")
            send_btn = st.form_submit_button("Send Message", type="primary")
            if send_btn and new_msg.strip():
                supabase.table("messages").insert({
                    "proposal_id": proposal_id,
                    "sender_id": user_id,
                    "content": new_msg.strip()
                }).execute()

                send_notification(
                    user_id=recipient_id,
                    title="💬 New Trade Message Received",
                    message=f"You received a new message regarding Trade #{proposal_id[:8].upper()}."
                )
                st.rerun()
    except Exception as e:
        st.error(f"Error loading chat: {e}")


# -----------------------------------------------------------------------------
# 3. MILESTONE TRACKER MODULE
# -----------------------------------------------------------------------------
def render_milestones_tracker(prop, user_id):
    st.markdown("#### 🎯 Deliverable Milestones & Sign-Off")
    proposal_id = prop["id"]
    is_proposer = (user_id == prop["proposer_id"])
    partner_id = prop["recipient_id"] if is_proposer else prop["proposer_id"]

    try:
        ms_res = supabase.table("trade_milestones").select("*").eq("proposal_id", proposal_id).order("created_at", asc=True).execute()
        milestones = ms_res.data or []

        if milestones:
            completed_count = 0
            for ms in milestones:
                p_done = ms.get("is_completed_proposer", False)
                r_done = ms.get("is_completed_recipient", False)
                both_done = p_done and r_done
                if both_done:
                    completed_count += 1

                status_text = "✅ Approved by Both" if both_done else ("⏳ Pending Approval" if (p_done or r_done) else "⚪ In Progress")
                
                with st.container(border=True):
                    col_m1, col_m2 = st.columns([3, 1])
                    with col_m1:
                        st.markdown(f"**Milestone:** {ms['title']}")
                        st.caption(f"Status: {status_text}")
                    with col_m2:
                        my_status = p_done if is_proposer else r_done
                        if not my_status:
                            if st.button("Sign Off", key=f"ms_sign_{ms['id']}"):
                                update_field = "is_completed_proposer" if is_proposer else "is_completed_recipient"
                                supabase.table("trade_milestones").update({update_field: True}).eq("id", ms["id"]).execute()
                                
                                send_notification(
                                    user_id=partner_id,
                                    title="🎯 Milestone Signed Off",
                                    message=f"Partner signed off on milestone: '{ms['title']}'."
                                )
                                st.toast("Milestone signed off!", icon="✅")
                                st.rerun()
                        else:
                            st.success("Signed Off")

            st.caption(f"Progress: **{completed_count}/{len(milestones)}** Milestones Completed")
            if completed_count == len(milestones) and len(milestones) > 0 and prop["status"] != "completed":
                if st.button("🏆 Mark Entire Trade as Completed", type="primary", key=f"complete_trade_{proposal_id}"):
                    supabase.table("trade_proposals").update({"status": "completed"}).eq("id", proposal_id).execute()
                    send_notification(user_id=partner_id, title="🏆 Trade Completed!", message="All milestones signed off and trade completed.")
                    st.toast("Trade successfully completed!", icon="🏆")
                    st.rerun()
        else:
            st.info("No deliverable milestones added yet.")

        with st.popover("➕ Add Milestone", use_container_width=False):
            with st.form(key=f"add_ms_form_{proposal_id}"):
                ms_title = st.text_input("Milestone Title", placeholder="e.g. Initial Wireframe Approval")
                submit_ms = st.form_submit_button("Add Milestone", type="primary")
                if submit_ms and ms_title.strip():
                    supabase.table("trade_milestones").insert({"proposal_id": proposal_id, "title": ms_title.strip()}).execute()
                    st.toast("Milestone added!", icon="🎯")
                    st.rerun()
    except Exception as e:
        st.error(f"Error loading milestones: {e}")


# -----------------------------------------------------------------------------
# 4. GEOGRAPHIC MAP DISCOVERY MODULE
# -----------------------------------------------------------------------------
def render_barter_map():
    st.subheader("🗺️ Geographic Barter Discovery Map")
    st.caption("Locate local business offers and needs geographically in your region.")

    try:
        posts_query = supabase.table("posts").select("*, profiles(*)").execute()
        posts = posts_query.data or []

        map_data = []
        for p in posts:
            prof = p.get("profiles") or {}
            lat = float(prof.get("latitude") or 45.5017)
            lon = float(prof.get("longitude") or -73.5673)
            p_type = p.get("type") or p.get("post_type") or "Offer"

            map_data.append({
                "lat": lat,
                "lon": lon,
                "title": p["title"],
                "business_name": prof.get("business_name", "Business"),
                "category": p.get("category", "General"),
                "type": p_type
            })

        if map_data:
            df_map = pd.DataFrame(map_data)
            st.map(df_map, latitude="lat", longitude="lon", zoom=10, size=20)
            
            st.divider()
            st.markdown("### 📍 Local Member Map Directory")
            st.dataframe(df_map[["business_name", "title", "type", "category"]], use_container_width=True)
        else:
            st.info("No mapped listings available yet.")
    except Exception as e:
        st.error(f"Error rendering barter map: {e}")


# -----------------------------------------------------------------------------
# 5. NOTIFICATION & SMART MATCHES MODULE
# -----------------------------------------------------------------------------
def render_notifications_feed(user_id):
    st.subheader("🔔 Activity & System Notifications")
    try:
        res = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        notifications = res.data or []

        if not notifications:
            st.info("You have no new notifications.")
            return

        col_clear, _ = st.columns([1, 4])
        with col_clear:
            if st.button("✔️ Mark All as Read", type="secondary"):
                supabase.table("notifications").update({"is_read": True}).eq("user_id", user_id).execute()
                st.rerun()

        st.divider()
        for notif in notifications:
            is_unread = not notif.get("is_read", False)
            bg_badge = "🔴 UNREAD" if is_unread else "⚪ READ"
            with st.container(border=True):
                st.markdown(f"**{bg_badge} | {notif['title']}**")
                st.caption(f"Received: {notif['created_at'][:10]} {notif['created_at'][11:16]}")
                st.write(notif["message"])
    except Exception as e:
        st.error(f"Error loading notifications: {e}")

def render_smart_matches(user_id, my_posts):
    st.subheader("⚡ Automated Barter Matchmaker")
    st.caption("Algorithmically matching your company's active needs with complementary partner offers across the network.")

    my_needs = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Need"]
    my_offers = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Offer"]

    if not my_needs and not my_offers:
        st.info("💡 Create at least one **Offer** or **Need** in '➕ Create Post' to enable automated matching!")
        return

    try:
        all_other_res = supabase.table("posts").select("*, profiles(*)").neq("user_id", user_id).execute()
        all_other_posts = all_other_res.data or []
        matches = []

        for my_need in my_needs:
            need_cat = (my_need.get("category") or "").lower().strip()
            need_title = (my_need.get("title") or "").lower()

            for other_post in all_other_posts:
                other_type = other_post.get("type") or other_post.get("post_type") or "Offer"
                if other_type != "Offer":
                    continue
                
                other_cat = (other_post.get("category") or "").lower().strip()
                other_title = (other_post.get("title") or "").lower()

                match_score = 0
                if need_cat and need_cat == other_cat: match_score += 60
                if any(word in other_title for word in need_title.split() if len(word) > 3): match_score += 35

                if match_score >= 50:
                    matches.append({"my_need": my_need, "other_offer": other_post, "score": min(match_score, 98)})

        matches.sort(key=lambda x: x["score"], reverse=True)

        if not matches:
            st.warning("No high-confidence matches found yet. Try posting more specific categories or listing additional Needs.")
        else:
            st.success(f"🎯 Found **{len(matches)}** high-compatibility barter matches for your company!")
            for match in matches:
                need, offer = match["my_need"], match["other_offer"]
                prof = offer.get("profiles") or {}
                with st.container(border=True):
                    col_score, col_details = st.columns([1, 4])
                    with col_score:
                        st.metric("Compatibility", f"{match['score']}%", delta="High Match")
                    with col_details:
                        st.markdown(f"### 🎯 You Need: *{need['title']}* $\\rightarrow$ Partner Offers: **{offer['title']}**")
                        st.caption(f"🏢 Offered by **{prof.get('business_name', 'Partner')}** | 📍 {prof.get('location', 'Montreal, QC')} | 🏷️ Category: {offer.get('category', 'General')}")
                        st.write(offer.get("description", "")[:180] + "...")
                        st.divider()
                        if st.button("🤝 Quick Propose Swap", key=f"quick_match_{need['id']}_{offer['id']}", type="primary"):
                            supabase.table("trade_proposals").insert({
                                "proposer_id": user_id, "recipient_id": offer["user_id"],
                                "target_post_id": offer["id"], "offered_post_id": need["id"],
                                "message": f"Smart Match Connection: We are interested in swapping our {need['title']} listing for your {offer['title']}!"
                            }).execute()
                            send_notification(offer["user_id"], "🚀 New Smart Match Proposal Received", f"A company proposed a trade for '{offer['title']}'.")
                            st.toast("Trade proposal sent to partner!", icon="🚀")
                            st.rerun()
    except Exception as e:
        st.error(f"Error executing matchmaker: {e}")


# -----------------------------------------------------------------------------
# 6. AI-ENHANCED TRADE PROPOSALS (PHASE 13)
# -----------------------------------------------------------------------------
def render_trade_proposal_card(prop, is_incoming, user_id):
    target = prop.get("target") or {}
    offered = prop.get("offered") or {}
    partner_prof = prop.get("proposer") if is_incoming else prop.get("recipient")
    partner_prof = partner_prof or {}
    
    status = prop.get("status", "pending")
    cash_topup = float(prop.get("cash_topup_amount") or 0.0)
    cash_payer = prop.get("cash_payer_id")
    ai_appraisal = prop.get("ai_appraisal")

    status_badge = {"pending": "⏳ PENDING", "accepted": "✅ ACCEPTED", "declined": "❌ DECLINED", "cancelled": "🚫 CANCELLED", "completed": "🏆 COMPLETED"}.get(status, status.upper())
    direction_text = "Offer from" if is_incoming else "Sent to"

    with st.container(border=True):
        st.markdown(f"### {status_badge} | {direction_text} {partner_prof.get('business_name', 'Business')}")
        st.caption(f"Date: {prop['created_at'][:10]} | Contact: {partner_prof.get('contact_email', 'N/A')}")
        
        col_left, col_swap, col_right = st.columns([2, 1, 2])
        with col_left:
            st.markdown(f"**{'Your Item' if is_incoming else 'Your Offered Item'}:** {target.get('title') if is_incoming else offered.get('title')}")
            st.caption((target.get('description') if is_incoming else offered.get('description', ''))[:100] + "...")
        with col_swap:
            st.markdown("### 🔄 SWAP")
        with col_right:
            st.markdown(f"**{'Their Offered Item' if is_incoming else 'Target Listing'}:** {offered.get('title') if is_incoming else target.get('title')}")
            st.caption((offered.get('description') if is_incoming else target.get('description', ''))[:100] + "...")

        if cash_topup > 0:
            payer_name = "Proposer" if cash_payer == prop["proposer_id"] else "Recipient"
            st.info(f"💵 **Cash Top-Up Included:** ${cash_topup:,.2f} CAD paid by {payer_name} to balance valuation.")
        
        if prop.get("message"):
            st.caption(f"💬 **Note:** {prop['message']}")

        # 🤖 AI DEAL APPRAISER INTEGRATION
        with st.expander("🤖 AI Deal Appraisal & Market Valuation"):
            if ai_appraisal:
                st.markdown(ai_appraisal)
            else:
                st.write("Get an objective, third-party AI estimate on the Fair Market Value (FMV) of both services to see if this is a fair trade.")
                if st.button("Generate AI Appraisal", key=f"ai_app_{prop['id']}"):
                    with st.spinner("AI Appraiser is analyzing market rates..."):
                        appraisal_result = get_ai_deal_appraisal(
                            offered.get("title", ""), offered.get("description", ""),
                            target.get("title", ""), target.get("description", "")
                        )
                        supabase.table("trade_proposals").update({"ai_appraisal": appraisal_result}).eq("id", prop["id"]).execute()
                        st.rerun()

        if status == "pending":
            if is_incoming:
                col_acc, col_dec, _ = st.columns([1, 1, 3])
                with col_acc:
                    if st.button("✅ Accept Trade", key=f"acc_{prop['id']}", type="primary"):
                        supabase.table("trade_proposals").update({"status": "accepted"}).eq("id", prop["id"]).execute()
                        send_notification(prop["proposer_id"], "🎉 Trade Proposal Accepted!", f"Your trade proposal for '{target.get('title')}' was accepted.")
                        st.toast("Trade proposal accepted!", icon="🎉")
                        st.rerun()
                with col_dec:
                    if st.button("❌ Decline Trade", key=f"dec_{prop['id']}", type="secondary"):
                        supabase.table("trade_proposals").update({"status": "declined"}).eq("id", prop["id"]).execute()
                        st.rerun()
            else:
                if st.button("🚫 Cancel Proposal", key=f"cncl_{prop['id']}", type="secondary"):
                    supabase.table("trade_proposals").update({"status": "cancelled"}).eq("id", prop["id"]).execute()
                    st.rerun()

        if status in ["accepted", "completed"]:
            st.success("🎉 **Trade Agreement Active!** Contact details, chat & milestones unlocked below.")
            with st.expander("📄 View Formal Barter Summary & Contract", expanded=False):
                html_contract = f"""<!DOCTYPE html><html><head><style>body{{font-family:sans-serif;padding:20px;color:#333;}} .header{{border-bottom:2px solid #2563EB;padding-bottom:10px;}} .section{{margin-top:20px;}}</style></head>
<body><div class="header"><h1>TRADEIT B2B BARTER CONTRACT</h1><p>Ref: {prop['id']} | Date: {prop['created_at'][:10]}</p></div>
<div class="section"><h3>PARTY A: {partner_prof.get('business_name') if is_incoming else 'You'}</h3><p>Provided: {offered.get('title')}</p></div>
<div class="section"><h3>PARTY B: {'You' if is_incoming else partner_prof.get('business_name')}</h3><p>Provided: {target.get('title')}</p></div>
<div class="section"><p><strong>Cash Adjustment:</strong> ${cash_topup:,.2f} CAD</p></div></body></html>"""
                st.download_button("📥 Download Formal Contract (.HTML)", html_contract, file_name=f"TradeIt_Contract_{prop['id'][:8]}.html", mime="text/html", key=f"dl_agreed_{prop['id']}")
            
            st.divider()
            render_milestones_tracker(prop, user_id)
            st.divider()
            render_chat_window(prop["id"], user_id, prop["proposer_id"] if is_incoming else prop["recipient_id"])

def render_trade_proposals(user_id):
    st.subheader("📬 Trade Proposals Inbox")
    tab_incoming, tab_outgoing = st.tabs(["📥 Received Proposals", "📤 Sent Proposals"])
    
    with tab_incoming:
        inc_res = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*)").eq("recipient_id", user_id).order("created_at", desc=True).execute()
        incoming = inc_res.data or []
        if not incoming: st.info("No incoming trade proposals yet.")
        for prop in incoming: render_trade_proposal_card(prop, True, user_id)

    with tab_outgoing:
        out_res = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), recipient:profiles!recipient_id(*)").eq("proposer_id", user_id).order("created_at", desc=True).execute()
        outgoing = out_res.data or []
        if not outgoing: st.info("You haven't sent any trade proposals yet.")
        for prop in outgoing: render_trade_proposal_card(prop, False, user_id)


# -----------------------------------------------------------------------------
# 7. REMAINING MODULES (Analytics, Admin, Auth, Profile, Listings, Feed)
# -----------------------------------------------------------------------------
def render_analytics_dashboard(user_id):
    st.subheader("📊 Barter Performance & Accounting ROI Dashboard")
    try:
        props_res = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*), recipient:profiles!recipient_id(*)").or_(f"proposer_id.eq.{user_id},recipient_id.eq.{user_id}").execute()
        proposals = props_res.data or []
        posts_res = supabase.table("posts").select("*").eq("user_id", user_id).execute()
        
        completed_trades = [p for p in proposals if p.get("status") in ["accepted", "completed"]]
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Active Listings", len(posts_res.data or []))
        col2.metric("Pending Proposals", sum(1 for p in proposals if p.get("status") == "pending"))
        col3.metric("Trades Completed", len(completed_trades))
        col4.metric("Est. Cash Saved", f"${len(completed_trades) * 1250:,} CAD", delta="Barter ROI")
        st.divider()
        st.markdown("### 📄 Corporate Tax & Audit CSV Exporter")
        
        if completed_trades:
            export_rows = [{"Transaction_ID": t["id"], "Date": t["created_at"][:10], "Status": t["status"].upper(), "Est_Valuation_CAD": 1250.00 + float(t.get("cash_topup_amount") or 0.0)} for t in completed_trades]
            df_export = pd.DataFrame(export_rows)
            st.dataframe(df_export, use_container_width=True)
            st.download_button("📥 Download Barter Tax Ledger (.CSV)", df_export.to_csv(index=False).encode('utf-8'), file_name=f"TradeIt_Tax_Ledger_{user_id[:8]}.csv", mime="text/csv", type="primary")
        else:
            st.info("No completed barter trades logged yet.")
    except Exception as e:
        st.error(f"Error loading analytics: {e}")

def render_admin_panel():
    st.subheader("🛡️ Platform Admin & Moderation Operations")
    try:
        all_posts = supabase.table("posts").select("*, profiles(*)").execute().data or []
        all_profiles = supabase.table("profiles").select("*").execute().data or []
        tab_mod_posts, tab_mod_users = st.tabs(["📌 Moderate Listings", "🏢 Company Verification"])
        with tab_mod_posts:
            for post in all_posts:
                with st.container(border=True):
                    col_info, col_btn = st.columns([4, 1])
                    with col_info: st.write(f"**{post['title']}** | ID: {post['id']}")
                    with col_btn:
                        if st.button("🗑️ Remove", key=f"admin_del_{post['id']}", type="secondary"):
                            supabase.table("posts").delete().eq("id", post["id"]).execute()
                            st.rerun()
        with tab_mod_users:
            for p in all_profiles:
                with st.container(border=True):
                    col_u_info, col_u_btn = st.columns([3, 1])
                    with col_u_info: st.write(f"**{p.get('business_name')}** | Verified: {p.get('is_verified')}")
                    with col_u_btn:
                        if st.button("Toggle Verification", key=f"admin_verify_{p['id']}"):
                            supabase.table("profiles").update({"is_verified": not p.get("is_verified")}).eq("id", p["id"]).execute()
                            st.rerun()
    except Exception as e:
        st.error(f"Admin Panel Error: {e}")

def render_auth_page():
    st.title("🤝 Welcome to TradeIt")
    st.caption("The B2B Barter Marketplace for Business Services & Resources")
    auth_mode = st.radio("Choose Mode", ["Sign In", "Create Account"], horizontal=True)
    with st.form("auth_form", clear_on_submit=False):
        email, password = st.text_input("Email Address"), st.text_input("Password", type="password")
        business_name, location = None, "Montreal, QC"
        if auth_mode == "Create Account":
            business_name, location = st.text_input("Business Name"), st.text_input("Location", value="Montreal, QC")
        if st.form_submit_button(auth_mode, type="primary"):
            if not email or not password:
                st.error("Please fill in both email and password."); return
            try:
                if auth_mode == "Sign In":
                    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                    st.session_state.user = res.user
                    st.rerun()
                else:
                    if not business_name:
                        st.error("Please enter your Business Name."); return
                    res = supabase.auth.sign_up({"email": email, "password": password})
                    if res.user:
                        supabase.table("profiles").upsert({"id": res.user.id, "business_name": business_name, "contact_email": email, "location": location}).execute()
                        st.session_state.user = res.user
                        st.rerun()
            except Exception as e:
                st.error(f"Authentication error: {e}")

def render_my_listings(user_id):
    st.subheader("📋 My Active Listings")
    my_posts = supabase.table("posts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data or []
    if not my_posts: st.info("You haven't posted any barter offers or needs yet.")
    for post in my_posts:
        with st.container(border=True):
            st.markdown(f"### {post['title']}")
            if st.button("🗑️ Delete", key=f"del_{post['id']}", type="secondary"):
                supabase.table("posts").delete().eq("id", post["id"]).execute()
                st.rerun()

def render_business_profile(user_id):
    st.subheader("🏢 Business Profile & Brand Showcase")
    profile_data = supabase.table("profiles").select("*").eq("id", user_id).execute().data
    profile_data = profile_data[0] if profile_data else {}
    
    with st.form("edit_profile_form"):
        edit_biz_name = st.text_input("Business Name", value=profile_data.get("business_name") or "")
        edit_contact_email = st.text_input("Contact Email", value=profile_data.get("contact_email") or "")
        edit_webhook = st.text_input("Zapier / Make Webhook Endpoint (Optional)", value=profile_data.get("webhook_url") or "")
        if st.form_submit_button("Save Profile", type="primary"):
            supabase.table("profiles").upsert({"id": user_id, "business_name": edit_biz_name, "contact_email": edit_contact_email, "webhook_url": edit_webhook}).execute()
            st.toast("Profile updated!", icon="🎉")
            st.rerun()

def main_app():
    user = st.session_state.user
    unread_count = len(supabase.table("notifications").select("id").eq("user_id", user.id).eq("is_read", False).execute().data or [])
    my_prof_res = supabase.table("profiles").select("is_admin").eq("id", user.id).execute()
    is_admin = my_prof_res.data[0].get("is_admin", False) if my_prof_res.data else False

    with st.sidebar:
        st.title("🤝 TradeIt B2B")
        st.write(f"Logged in as:\n**{user.email}**")
        if unread_count > 0: st.warning(f"🔔 **{unread_count} Unread Notification(s)**")
        if st.button("Sign Out", type="secondary"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.rerun()

    tabs = st.tabs(["🌐 Barter Feed", "⚡ Smart Matches", "🗺️ Barter Map", "➕ Create Post", "📋 My Listings", f"📬 Trade Proposals ({unread_count})", "📊 ROI Analytics", "🏢 Profile"] + (["🛡️ Admin"] if is_admin else []))
    my_active_posts = supabase.table("posts").select("*").eq("user_id", user.id).execute().data or []

    with tabs[0]:
        st.subheader("Browse Barter Opportunities")
        all_posts = supabase.table("posts").select("*, profiles(*)").order("created_at", desc=True).execute().data or []
        for post in all_posts:
            with st.container(border=True):
                st.markdown(f"### {post['title']}")
                st.caption(f"🏢 **{(post.get('profiles') or {}).get('business_name', 'Business')}**")
                st.write(post.get("description", ""))
                if post["user_id"] != user.id:
                    with st.popover("🤝 Propose Trade"):
                        if not my_active_posts: st.warning("Create a post first!")
                        else:
                            with st.form(key=f"prop_form_{post['id']}"):
                                post_options = {p['title']: p["id"] for p in my_active_posts}
                                selected_label = st.selectbox("Select item to offer:", list(post_options.keys()))
                                submit_prop = st.form_submit_button("Send Proposal", type="primary")
                                if submit_prop:
                                    supabase.table("trade_proposals").insert({"proposer_id": user.id, "recipient_id": post["user_id"], "target_post_id": post["id"], "offered_post_id": post_options[selected_label]}).execute()
                                    st.toast("Proposal sent!", icon="🚀")
                                    st.rerun()

    with tabs[1]: render_smart_matches(user.id, my_active_posts)
    with tabs[2]: render_barter_map()
    with tabs[3]:
        with st.form("create_post_form", clear_on_submit=True):
            post_type = st.selectbox("I want to...", ["Offer", "Need"])
            title, desc = st.text_input("Title"), st.text_area("Description")
            if st.form_submit_button("Publish Post", type="primary") and title:
                supabase.table("posts").insert({"user_id": user.id, "title": title, "type": post_type, "post_type": post_type, "description": desc}).execute()
                st.rerun()
    with tabs[4]: render_my_listings(user.id)
    with tabs[5]: render_trade_proposals(user.id)
    with tabs[6]: render_analytics_dashboard(user.id)
    with tabs[7]: render_business_profile(user.id)
    if is_admin:
        with tabs[8]: render_admin_panel()

if __name__ == "__main__":
    if not st.session_state.user:
        try:
            session_resp = supabase.auth.get_session()
            if session_resp and session_resp.user: st.session_state.user = session_resp.user
        except: pass
    if st.session_state.user: main_app()
    else: render_auth_page()