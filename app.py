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
# 2. HELPER FUNCTIONS FOR AI, EMBEDDINGS, STORAGE & WEBHOOKS
# -----------------------------------------------------------------------------
def generate_embedding(text):
    """Generates a 1536-dimensional semantic vector for matchmaking."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        return None
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        return None

def get_ai_deal_appraisal(offered_title, offered_desc, target_title, target_desc):
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        return "⚠️ OpenAI API key missing. Please configure OPENAI_API_KEY."
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
        1. **Valuation A:** Estimated standard market value of Party A's offer in CAD (give a realistic range).
        2. **Valuation B:** Estimated standard market value of Party B's offer in CAD.
        3. **Mediator's Verdict:** A conclusion on fairness and a specific Cash Top-Up amount to balance the deal.
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
        supabase.storage.from_("barter-media").upload(path=file_path, file=file_bytes, file_options={"content-type": uploaded_file.type})
        return supabase.storage.from_("barter-media").get_public_url(file_path)
    except Exception as e:
        return None

def render_media(url, width=350):
    if not url: return
    video_exts = [".mp4", ".mov", ".webm", ".m4v", ".mkv"]
    if any(ext in url.lower() for ext in video_exts): st.video(url)
    else: st.image(url, width=width)

def trigger_webhook(user_id, event_type, payload):
    try:
        prof_res = supabase.table("profiles").select("webhook_url").eq("id", user_id).execute()
        if prof_res.data and prof_res.data[0].get("webhook_url"):
            req = urllib.request.Request(
                prof_res.data[0]["webhook_url"],
                data=json.dumps({"event": event_type, "data": payload}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass

def send_notification(user_id, title, message):
    try:
        supabase.table("notifications").insert({"user_id": user_id, "title": title, "message": message}).execute()
        trigger_webhook(user_id, "notification_received", {"title": title, "message": message})
    except Exception:
        pass


# -----------------------------------------------------------------------------
# 3. MILESTONE TRACKER & CHAT
# -----------------------------------------------------------------------------
def render_chat_window(proposal_id, user_id, recipient_id):
    try:
        messages = supabase.table("messages").select("*, sender:profiles(business_name)").eq("proposal_id", proposal_id).order("created_at", asc=True).execute().data or []
        st.markdown("#### 💬 Partner Messages & Updates")
        with st.container(height=220, border=True):
            if not messages: st.caption("No messages yet. Send a note below.")
            for msg in messages:
                sender_name = (msg.get("sender") or {}).get("business_name") or "User"
                prefix = "👤 **You**" if msg["sender_id"] == user_id else f"🏢 **{sender_name}**"
                st.markdown(f"{prefix} *({msg['created_at'][11:16]})*")
                st.write(msg["content"])
                st.divider()

        with st.form(key=f"msg_form_{proposal_id}", clear_on_submit=True):
            new_msg = st.text_input("Type your message...")
            if st.form_submit_button("Send Message", type="primary") and new_msg.strip():
                supabase.table("messages").insert({"proposal_id": proposal_id, "sender_id": user_id, "content": new_msg.strip()}).execute()
                send_notification(recipient_id, "💬 New Trade Message Received", f"Trade #{proposal_id[:8].upper()} update.")
                st.rerun()
    except Exception as e:
        st.error(f"Error loading chat: {e}")

def render_milestones_tracker(prop, user_id):
    st.markdown("#### 🎯 Deliverable Milestones & Sign-Off")
    proposal_id, is_proposer = prop["id"], (user_id == prop["proposer_id"])
    partner_id = prop["recipient_id"] if is_proposer else prop["proposer_id"]

    try:
        milestones = supabase.table("trade_milestones").select("*").eq("proposal_id", proposal_id).order("created_at", asc=True).execute().data or []
        completed_count = 0
        if milestones:
            for ms in milestones:
                p_done, r_done = ms.get("is_completed_proposer", False), ms.get("is_completed_recipient", False)
                both_done = p_done and r_done
                if both_done: completed_count += 1
                
                with st.container(border=True):
                    col_m1, col_m2 = st.columns([3, 1])
                    with col_m1:
                        st.markdown(f"**Milestone:** {ms['title']}")
                        st.caption(f"Status: {'✅ Approved by Both' if both_done else ('⏳ Pending Approval' if (p_done or r_done) else '⚪ In Progress')}")
                    with col_m2:
                        my_status = p_done if is_proposer else r_done
                        if not my_status:
                            if st.button("Sign Off", key=f"ms_sign_{ms['id']}"):
                                update_field = "is_completed_proposer" if is_proposer else "is_completed_recipient"
                                supabase.table("trade_milestones").update({update_field: True}).eq("id", ms["id"]).execute()
                                send_notification(partner_id, "🎯 Milestone Signed Off", f"Partner signed off on: '{ms['title']}'.")
                                st.rerun()
                        else:
                            st.success("Signed Off")

            st.caption(f"Progress: **{completed_count}/{len(milestones)}** Milestones Completed")
            if completed_count == len(milestones) and len(milestones) > 0 and prop["status"] != "completed":
                if st.button("🏆 Mark Trade Completed", type="primary", key=f"complete_trade_{proposal_id}"):
                    supabase.table("trade_proposals").update({"status": "completed"}).eq("id", proposal_id).execute()
                    send_notification(partner_id, "🏆 Trade Completed!", "All milestones signed off.")
                    st.rerun()
        else:
            st.info("No milestones added yet.")

        with st.popover("➕ Add Milestone"):
            with st.form(key=f"add_ms_form_{proposal_id}"):
                ms_title = st.text_input("Milestone Title")
                if st.form_submit_button("Add Milestone", type="primary") and ms_title.strip():
                    supabase.table("trade_milestones").insert({"proposal_id": proposal_id, "title": ms_title.strip()}).execute()
                    st.rerun()
    except Exception as e:
        st.error(f"Error loading milestones: {e}")


# -----------------------------------------------------------------------------
# 4. MAP & NOTIFICATIONS
# -----------------------------------------------------------------------------
def render_barter_map():
    st.subheader("🗺️ Geographic Barter Discovery Map")
    try:
        posts = supabase.table("posts").select("*, profiles(*)").execute().data or []
        map_data = [{"lat": float((p.get("profiles") or {}).get("latitude") or 45.5017), "lon": float((p.get("profiles") or {}).get("longitude") or -73.5673), "title": p["title"], "business_name": (p.get("profiles") or {}).get("business_name", "Business"), "category": p.get("category", "General"), "type": p.get("type") or p.get("post_type") or "Offer"} for p in posts]
        
        if map_data:
            df_map = pd.DataFrame(map_data)
            st.map(df_map, latitude="lat", longitude="lon", zoom=10, size=20)
            st.dataframe(df_map[["business_name", "title", "type", "category"]], use_container_width=True)
        else:
            st.info("No mapped listings available yet.")
    except Exception as e:
        st.error(f"Error rendering map: {e}")

def render_notifications_feed(user_id):
    st.subheader("🔔 Activity & System Notifications")
    try:
        notifications = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data or []
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
            bg_badge = "🔴 UNREAD" if not notif.get("is_read") else "⚪ READ"
            with st.container(border=True):
                st.markdown(f"**{bg_badge} | {notif['title']}**")
                st.caption(f"Received: {notif['created_at'][:10]} {notif['created_at'][11:16]}")
                st.write(notif["message"])
    except Exception as e:
        st.error(f"Error loading notifications: {e}")


# -----------------------------------------------------------------------------
# 5. SEMANTIC VECTOR MATCHMAKING (PHASE 14 UPGRADE)
# -----------------------------------------------------------------------------
def render_smart_matches(user_id, my_posts):
    st.subheader("⚡ AI Semantic Barter Matchmaker")
    st.caption("Powered by vector embeddings. Algorithmically matching the meaning of your needs with relevant offers.")

    my_needs = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Need"]
    
    if not my_needs:
        st.info("💡 Create at least one **Need** in '➕ Create Post' to enable AI semantic matching!")
        return

    for my_need in my_needs:
        st.markdown(f"### 🎯 Matches for your Need: *{my_need['title']}*")
        
        matches = []
        if my_need.get("embedding"):
            # Execute Vector Semantic Search via pgvector RPC
            try:
                res = supabase.rpc("match_barter_posts", {
                    "query_embedding": my_need["embedding"],
                    "match_threshold": 0.2, # 20% minimum similarity to show up
                    "match_count": 5,
                    "target_type": "Offer",
                    "exclude_user_id": user_id
                }).execute()
                
                # Fetch company details for matched vectors
                for matched_offer in (res.data or []):
                    prof = supabase.table("profiles").select("*").eq("id", matched_offer["user_id"]).execute().data
                    matched_offer["profiles"] = prof[0] if prof else {}
                    matches.append({"offer": matched_offer, "score": min(int(matched_offer["similarity"] * 100), 99)})
            except Exception as e:
                st.error(f"Vector search failed. (Make sure you ran the pgvector SQL snippet): {e}")
        else:
            st.warning("⚠️ This post is older and lacks a semantic embedding. Edit and re-save the post to generate an AI vector.")

        if not matches:
            st.info("No high-confidence AI semantic matches found for this need yet.")
        else:
            for match in matches:
                offer = match["offer"]
                prof = offer.get("profiles", {})
                with st.container(border=True):
                    col_score, col_details = st.columns([1, 4])
                    with col_score:
                        st.metric("AI Match", f"{match['score']}%", delta="Semantic Similarity")
                    with col_details:
                        st.markdown(f"**Partner Offers:** {offer.get('title')}")
                        st.caption(f"🏢 **{prof.get('business_name', 'Partner')}** | 📍 {prof.get('location', 'Montreal, QC')} | 🏷️ {offer.get('category')}")
                        st.write(offer.get("description", "")[:180] + "...")
                        st.divider()
                        if st.button("🤝 Quick Propose Swap", key=f"v_match_{my_need['id']}_{offer['id']}", type="primary"):
                            supabase.table("trade_proposals").insert({
                                "proposer_id": user_id, "recipient_id": offer["user_id"],
                                "target_post_id": offer["id"], "offered_post_id": my_need["id"],
                                "message": f"AI Semantic Match Connection: Interested in swapping '{my_need['title']}' for your '{offer.get('title')}'!"
                            }).execute()
                            send_notification(offer["user_id"], "🚀 AI Match Proposal", f"Received proposal for '{offer.get('title')}'.")
                            st.toast("Trade proposal sent!", icon="🚀")
                            st.rerun()
        st.divider()


# -----------------------------------------------------------------------------
# 6. TRADE PROPOSALS
# -----------------------------------------------------------------------------
def render_trade_proposal_card(prop, is_incoming, user_id):
    target, offered = prop.get("target") or {}, prop.get("offered") or {}
    partner_prof = prop.get("proposer") if is_incoming else prop.get("recipient")
    partner_prof = partner_prof or {}
    status, cash_topup, cash_payer = prop.get("status", "pending"), float(prop.get("cash_topup_amount") or 0.0), prop.get("cash_payer_id")
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
        with col_swap: st.markdown("### 🔄 SWAP")
        with col_right:
            st.markdown(f"**{'Their Offered Item' if is_incoming else 'Target Listing'}:** {offered.get('title') if is_incoming else target.get('title')}")
            st.caption((offered.get('description') if is_incoming else target.get('description', ''))[:100] + "...")

        if cash_topup > 0:
            st.info(f"💵 **Cash Top-Up Included:** ${cash_topup:,.2f} CAD paid by {'Proposer' if cash_payer == prop['proposer_id'] else 'Recipient'}.")
        
        if prop.get("message"): st.caption(f"💬 **Note:** {prop['message']}")

        with st.expander("🤖 AI Deal Appraisal & Market Valuation"):
            if ai_appraisal: st.markdown(ai_appraisal)
            else:
                st.write("Get an objective, third-party AI estimate on Fair Market Value (FMV).")
                if st.button("Generate AI Appraisal", key=f"ai_app_{prop['id']}"):
                    with st.spinner("Analyzing market rates..."):
                        res = get_ai_deal_appraisal(offered.get("title", ""), offered.get("description", ""), target.get("title", ""), target.get("description", ""))
                        supabase.table("trade_proposals").update({"ai_appraisal": res}).eq("id", prop["id"]).execute()
                        st.rerun()

        if status == "pending":
            if is_incoming:
                col_acc, col_dec, _ = st.columns([1, 1, 3])
                with col_acc:
                    if st.button("✅ Accept", key=f"acc_{prop['id']}", type="primary"):
                        supabase.table("trade_proposals").update({"status": "accepted"}).eq("id", prop["id"]).execute()
                        send_notification(prop["proposer_id"], "🎉 Trade Accepted!", "Your trade proposal was accepted.")
                        st.rerun()
                with col_dec:
                    if st.button("❌ Decline", key=f"dec_{prop['id']}", type="secondary"):
                        supabase.table("trade_proposals").update({"status": "declined"}).eq("id", prop["id"]).execute()
                        st.rerun()
            else:
                if st.button("🚫 Cancel", key=f"cncl_{prop['id']}", type="secondary"):
                    supabase.table("trade_proposals").update({"status": "cancelled"}).eq("id", prop["id"]).execute()
                    st.rerun()

        if status in ["accepted", "completed"]:
            st.success("🎉 **Trade Agreement Active!** Contact details, chat & milestones unlocked below.")
            with st.expander("📄 View Formal Barter Contract", expanded=False):
                html_contract = f"<!DOCTYPE html><html><head><style>body{{font-family:sans-serif;padding:20px;}} .header{{border-bottom:2px solid #2563EB;padding-bottom:10px;}}</style></head><body><div class='header'><h1>B2B BARTER CONTRACT</h1><p>Ref: {prop['id']} | Date: {prop['created_at'][:10]}</p></div><h3>PARTY A: {partner_prof.get('business_name') if is_incoming else 'You'}</h3><p>Provided: {offered.get('title')}</p><h3>PARTY B: {'You' if is_incoming else partner_prof.get('business_name')}</h3><p>Provided: {target.get('title')}</p><p><strong>Cash Adjustment:</strong> ${cash_topup:,.2f} CAD</p></body></html>"
                st.download_button("📥 Download HTML Contract", html_contract, file_name=f"Contract_{prop['id'][:8]}.html", mime="text/html", key=f"dl_{prop['id']}")
            st.divider()
            render_milestones_tracker(prop, user_id)
            st.divider()
            render_chat_window(prop["id"], user_id, prop["proposer_id"] if is_incoming else prop["recipient_id"])

def render_trade_proposals(user_id):
    st.subheader("📬 Trade Proposals Inbox")
    tab_incoming, tab_outgoing = st.tabs(["📥 Received Proposals", "📤 Sent Proposals"])
    
    with tab_incoming:
        incoming = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*)").eq("recipient_id", user_id).order("created_at", desc=True).execute().data or []
        if not incoming: st.info("No incoming trade proposals yet.")
        for prop in incoming: render_trade_proposal_card(prop, True, user_id)

    with tab_outgoing:
        outgoing = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), recipient:profiles!recipient_id(*)").eq("proposer_id", user_id).order("created_at", desc=True).execute().data or []
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
        completed_trades = [p for p in proposals if p.get("status") in ["accepted", "completed"]]
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Active Listings", len(supabase.table("posts").select("*").eq("user_id", user_id).execute().data or []))
        col2.metric("Pending Proposals", sum(1 for p in proposals if p.get("status") == "pending"))
        col3.metric("Trades Completed", len(completed_trades))
        col4.metric("Est. Cash Saved", f"${len(completed_trades) * 1250:,} CAD")
        
        st.divider()
        st.markdown("### 📄 Corporate Tax & Audit CSV Exporter")
        if completed_trades:
            df = pd.DataFrame([{"ID": t["id"], "Date": t["created_at"][:10], "Status": t["status"].upper(), "Valuation_CAD": 1250.00 + float(t.get("cash_topup_amount") or 0.0)} for t in completed_trades])
            st.dataframe(df, use_container_width=True)
            st.download_button("📥 Download Tax Ledger (.CSV)", df.to_csv(index=False).encode('utf-8'), file_name=f"Tax_{user_id[:8]}.csv", mime="text/csv", type="primary")
        else: st.info("No completed barter trades logged yet.")
    except Exception as e: st.error(f"Error loading analytics: {e}")

def render_admin_panel():
    st.subheader("🛡️ Platform Admin & Moderation Operations")
    try:
        all_posts = supabase.table("posts").select("*, profiles(*)").execute().data or []
        all_profiles = supabase.table("profiles").select("*").execute().data or []
        tab_mod_posts, tab_mod_users = st.tabs(["📌 Moderate Listings", "🏢 Company Verification"])
        with tab_mod_posts:
            for post in all_posts:
                col_info, col_btn = st.columns([4, 1])
                with col_info: st.write(f"**{post['title']}** | ID: {post['id']}")
                with col_btn:
                    if st.button("🗑️ Remove", key=f"admin_del_{post['id']}", type="secondary"):
                        supabase.table("posts").delete().eq("id", post["id"]).execute()
                        st.rerun()
        with tab_mod_users:
            for p in all_profiles:
                col_u_info, col_u_btn = st.columns([3, 1])
                with col_u_info: st.write(f"**{p.get('business_name')}** | Verified: {p.get('is_verified')}")
                with col_u_btn:
                    if st.button("Toggle Verify", key=f"admin_v_{p['id']}"):
                        supabase.table("profiles").update({"is_verified": not p.get("is_verified")}).eq("id", p["id"]).execute()
                        st.rerun()
    except Exception as e: st.error(f"Admin Error: {e}")

def render_auth_page():
    st.title("🤝 Welcome to TradeIt")
    auth_mode = st.radio("Choose Mode", ["Sign In", "Create Account"], horizontal=True)
    with st.form("auth_form"):
        email, password = st.text_input("Email Address"), st.text_input("Password", type="password")
        b_name, loc = st.text_input("Business Name") if auth_mode == "Create Account" else None, st.text_input("Location", "Montreal, QC") if auth_mode == "Create Account" else "Montreal, QC"
        if st.form_submit_button(auth_mode, type="primary"):
            if not email or not password: st.error("Fill all fields."); return
            try:
                if auth_mode == "Sign In":
                    st.session_state.user = supabase.auth.sign_in_with_password({"email": email, "password": password}).user
                    st.rerun()
                elif b_name:
                    user = supabase.auth.sign_up({"email": email, "password": password}).user
                    if user:
                        supabase.table("profiles").upsert({"id": user.id, "business_name": b_name, "contact_email": email, "location": loc}).execute()
                        st.session_state.user = user
                        st.rerun()
            except Exception as e: st.error(f"Auth error: {e}")

def render_my_listings(user_id):
    st.subheader("📋 My Active Listings")
    posts = supabase.table("posts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data or []
    if not posts: st.info("No listings yet.")
    for p in posts:
        with st.container(border=True):
            st.markdown(f"### {p['title']}")
            if not p.get("embedding"): st.warning("⚠️ Lacks semantic vector. Edit and save to generate.")
            if st.button("🗑️ Delete", key=f"del_{p['id']}", type="secondary"):
                supabase.table("posts").delete().eq("id", p["id"]).execute()
                st.rerun()

def render_business_profile(user_id):
    st.subheader("🏢 Business Profile")
    prof = supabase.table("profiles").select("*").eq("id", user_id).execute().data
    prof = prof[0] if prof else {}
    with st.form("edit_profile_form"):
        b_name = st.text_input("Business Name", value=prof.get("business_name") or "")
        email = st.text_input("Contact Email", value=prof.get("contact_email") or "")
        hook = st.text_input("Zapier Webhook Endpoint", value=prof.get("webhook_url") or "")
        if st.form_submit_button("Save Profile", type="primary"):
            supabase.table("profiles").upsert({"id": user_id, "business_name": b_name, "contact_email": email, "webhook_url": hook}).execute()
            st.toast("Updated!", icon="🎉")
            st.rerun()

# -----------------------------------------------------------------------------
# 12. MAIN APP DASHBOARD
# -----------------------------------------------------------------------------
def main_app():
    user = st.session_state.user
    
    unread_count, is_admin = 0, False
    try:
        unread_count = len(supabase.table("notifications").select("id").eq("user_id", user.id).eq("is_read", False).execute().data or [])
        prof_res = supabase.table("profiles").select("is_admin").eq("id", user.id).execute().data
        is_admin = prof_res[0].get("is_admin", False) if prof_res else False
    except Exception: pass

    with st.sidebar:
        st.title("🤝 TradeIt B2B")
        st.write(f"Logged in as:\n**{user.email}**")
        if unread_count > 0: st.warning(f"🔔 **{unread_count} Unread Notification(s)**")
        if st.button("Sign Out", type="secondary"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.rerun()

    tabs = st.tabs(["🌐 Barter Feed", "⚡ Semantic Matches", "🗺️ Map", "➕ Create Post", "📋 My Listings", f"📬 Proposals ({unread_count})", "📊 Analytics", "🏢 Profile"] + (["🛡️ Admin"] if is_admin else []))
    my_active_posts = []
    try: my_active_posts = supabase.table("posts").select("*").eq("user_id", user.id).execute().data or []
    except Exception: pass

    with tabs[0]:
        st.subheader("Browse Barter Opportunities")
        try:
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
                                    opts = {p['title']: p["id"] for p in my_active_posts}
                                    sel = st.selectbox("Offer item:", list(opts.keys()))
                                    if st.form_submit_button("Send Proposal", type="primary"):
                                        supabase.table("trade_proposals").insert({"proposer_id": user.id, "recipient_id": post["user_id"], "target_post_id": post["id"], "offered_post_id": opts[sel]}).execute()
                                        st.toast("Sent!", icon="🚀")
                                        st.rerun()
        except Exception: st.error("Error loading feed.")

    with tabs[1]: render_smart_matches(user.id, my_active_posts)
    with tabs[2]: render_barter_map()
    with tabs[3]:
        with st.form("create_post_form", clear_on_submit=True):
            p_type, title, desc, cat = st.selectbox("I want to...", ["Offer", "Need"]), st.text_input("Title"), st.text_area("Description"), st.text_input("Category")
            if st.form_submit_button("Publish Post", type="primary") and title:
                with st.spinner("Generating semantic AI embedding..."):
                    embedding = generate_embedding(f"{title} {desc} {cat}")
                    post_data = {"user_id": user.id, "title": title, "type": p_type, "post_type": p_type, "description": desc, "category": cat if cat else "General"}
                    if embedding: post_data["embedding"] = embedding
                    supabase.table("posts").insert(post_data).execute()
                st.toast("Post published with AI Vector!", icon="🚀")
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
            res = supabase.auth.get_session()
            if res and res.user: st.session_state.user = res.user
        except: pass
    if st.session_state.user: main_app()
    else: render_auth_page()