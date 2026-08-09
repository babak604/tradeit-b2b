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
# 1. PAGE CONFIGURATION & CREDENTIALS (BRANDED WITH 🌀)
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="TradeIt AI 🌀 - Circular B2B Marketplace",
    page_icon="🌀",
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
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY: return None
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        return client.embeddings.create(input=text, model="text-embedding-3-small").data[0].embedding
    except Exception: return None

def upload_file_to_supabase(uploaded_file, user_id, folder="media"):
    try:
        file_bytes = uploaded_file.getvalue()
        file_ext = uploaded_file.name.split(".")[-1].lower()
        file_path = f"{folder}/{user_id}/{uuid.uuid4().hex}.{file_ext}"
        supabase.storage.from_("barter-media").upload(path=file_path, file=file_bytes, file_options={"content-type": uploaded_file.type})
        return supabase.storage.from_("barter-media").get_public_url(file_path)
    except Exception: return None

def trigger_webhook(user_id, event_type, payload):
    try:
        prof_res = supabase.table("profiles").select("webhook_url").eq("id", user_id).execute()
        if prof_res.data and prof_res.data[0].get("webhook_url"):
            req = urllib.request.Request(prof_res.data[0]["webhook_url"], data=json.dumps({"event": event_type, "data": payload}).encode('utf-8'), headers={'Content-Type': 'application/json'})
            urllib.request.urlopen(req, timeout=2)
    except Exception: pass

def send_notification(user_id, title, message):
    try:
        supabase.table("notifications").insert({"user_id": user_id, "title": title, "message": message}).execute()
        trigger_webhook(user_id, "notification_received", {"title": title, "message": message})
    except Exception: pass


# -----------------------------------------------------------------------------
# 3. MILESTONE TRACKER & CHAT
# -----------------------------------------------------------------------------
def render_chat_window(proposal_id, user_id, recipient_id):
    try:
        messages = supabase.table("messages").select("*, sender:profiles(business_name)").eq("proposal_id", proposal_id).order("created_at", asc=True).execute().data or []
        st.markdown("#### 💬 Partner Messages")
        with st.container(height=220, border=True):
            if not messages: st.caption("No messages yet. Send a note below.")
            for msg in messages:
                prefix = "👤 **You**" if msg["sender_id"] == user_id else f"🏢 **{(msg.get('sender') or {}).get('business_name') or 'User'}**"
                st.markdown(f"{prefix} *({msg['created_at'][11:16]})*")
                st.write(msg["content"])
                st.divider()

        with st.form(key=f"msg_form_{proposal_id}", clear_on_submit=True):
            new_msg = st.text_input("Type your message...")
            if st.form_submit_button("Send", type="primary") and new_msg.strip():
                supabase.table("messages").insert({"proposal_id": proposal_id, "sender_id": user_id, "content": new_msg.strip()}).execute()
                send_notification(recipient_id, "💬 New Message", f"Trade #{proposal_id[:8].upper()} update.")
                st.rerun()
    except Exception as e: st.error(f"Chat error: {e}")

def render_milestones_tracker(prop, user_id):
    st.markdown("#### 🌀 Deliverable Milestones")
    proposal_id, is_proposer = prop["id"], (user_id == prop["proposer_id"])
    partner_id = prop["recipient_id"] if is_proposer else prop["proposer_id"]

    try:
        milestones = supabase.table("trade_milestones").select("*").eq("proposal_id", proposal_id).order("created_at", asc=True).execute().data or []
        completed_count = sum(1 for ms in milestones if ms.get("is_completed_proposer") and ms.get("is_completed_recipient"))
        if milestones:
            for ms in milestones:
                p_done, r_done = ms.get("is_completed_proposer", False), ms.get("is_completed_recipient", False)
                with st.container(border=True):
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        st.markdown(f"**{ms['title']}**")
                        st.caption(f"Status: {'✅ Approved' if (p_done and r_done) else '⏳ Pending'}")
                    with col2:
                        if not (p_done if is_proposer else r_done):
                            if st.button("Sign Off", key=f"ms_sign_{ms['id']}"):
                                supabase.table("trade_milestones").update({"is_completed_proposer" if is_proposer else "is_completed_recipient": True}).eq("id", ms["id"]).execute()
                                send_notification(partner_id, "🌀 Milestone Signed", f"Partner signed off on: '{ms['title']}'.")
                                st.rerun()
                        else: st.success("Signed Off")
            st.caption(f"Progress: **{completed_count}/{len(milestones)}**")
            if completed_count == len(milestones) and prop["status"] != "completed" and st.button("🏆 Complete Trade", type="primary"):
                supabase.table("trade_proposals").update({"status": "completed"}).eq("id", proposal_id).execute()
                st.rerun()
        else: st.info("No milestones yet.")

        with st.popover("➕ Add Milestone"):
            with st.form(key=f"add_ms_form_{proposal_id}"):
                ms_title = st.text_input("Milestone Title")
                if st.form_submit_button("Add", type="primary") and ms_title.strip():
                    supabase.table("trade_milestones").insert({"proposal_id": proposal_id, "title": ms_title.strip()}).execute()
                    st.rerun()
    except Exception as e: st.error(f"Milestone error: {e}")


# -----------------------------------------------------------------------------
# 4. SMART MATCHES & CIRCULAR TRADES AGENT
# -----------------------------------------------------------------------------
def render_smart_matches(user_id, my_posts):
    st.subheader("⚡ AI Semantic Barter Matchmaker")
    my_needs = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Need"]
    if not my_needs:
        st.info("💡 Create at least one **Need** in '➕ Create Post' to enable AI matching!")
        return

    for my_need in my_needs:
        st.markdown(f"### 🎯 Matches for: *{my_need['title']}*")
        matches = []
        if my_need.get("embedding"):
            try:
                res = supabase.rpc("match_barter_posts", {"query_embedding": my_need["embedding"], "match_threshold": 0.2, "match_count": 5, "target_type": "Offer", "exclude_user_id": user_id}).execute()
                for matched_offer in (res.data or []):
                    prof = supabase.table("profiles").select("*").eq("id", matched_offer["user_id"]).execute().data
                    matched_offer["profiles"] = prof[0] if prof else {}
                    matches.append({"offer": matched_offer, "score": min(int(matched_offer["similarity"] * 100), 99)})
            except Exception: st.error("Vector search failed.")
        else: st.warning("⚠️ Edit and save this post to generate its AI vector.")

        if not matches: st.info("No semantic matches yet.")
        else:
            for match in matches:
                offer, prof = match["offer"], match["offer"].get("profiles", {})
                with st.container(border=True):
                    col1, col2 = st.columns([1, 4])
                    col1.metric("Match", f"{match['score']}%")
                    col2.markdown(f"**Offers:** {offer.get('title')}")
                    col2.caption(f"🏢 **{prof.get('business_name')}** | {offer.get('category')}")
                    if col2.button("🌀 Propose Swap", key=f"v_match_{my_need['id']}_{offer['id']}", type="primary"):
                        supabase.table("trade_proposals").insert({"proposer_id": user_id, "recipient_id": offer["user_id"], "target_post_id": offer["id"], "offered_post_id": my_need["id"]}).execute()
                        st.toast("Sent!", icon="🌀"); st.rerun()

def _heuristic_match(need, offer):
    n_cat = (need.get("category") or "").lower().strip()
    o_cat = (offer.get("category") or "").lower().strip()
    if n_cat and n_cat == o_cat: return True
    n_words = set(need.get("title", "").lower().split())
    o_words = set(offer.get("title", "").lower().split())
    return len({w for w in n_words.intersection(o_words) if len(w) > 3}) > 0

def render_circular_trades(user_id, my_posts):
    st.subheader("🌀 AI Multi-Party Circular Trade Agent")
    st.caption("Autonomous background agent discovering 3-way trade loops across the network.")

    my_needs = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Need"]
    my_offers = [p for p in my_posts if (p.get("type") or p.get("post_type")) == "Offer"]
    
    if not my_needs or not my_offers:
        st.info("💡 You must have at least one active **Offer** and one **Need** to find circular trades.")
        return

    try:
        all_posts = supabase.table("posts").select("*, profiles(*)").execute().data or []
        user_offers, user_needs = {}, {}
        for p in all_posts:
            uid = p["user_id"]
            if (p.get("type") or p.get("post_type")) == "Offer": user_offers.setdefault(uid, []).append(p)
            else: user_needs.setdefault(uid, []).append(p)

        loops = []
        for m_need in my_needs:
            for b_uid, b_offers in user_offers.items():
                if b_uid == user_id: continue
                for b_off in b_offers:
                    if _heuristic_match(m_need, b_off):
                        for b_need in user_needs.get(b_uid, []):
                            for c_uid, c_offers in user_offers.items():
                                if c_uid in [user_id, b_uid]: continue
                                for c_off in c_offers:
                                    if _heuristic_match(b_need, c_off):
                                        for c_need in user_needs.get(c_uid, []):
                                            for m_off in my_offers:
                                                if _heuristic_match(c_need, m_off):
                                                    loops.append({
                                                        "B_o": b_off, "B_prof": b_off.get("profiles", {}).get("business_name", "Partner B"),
                                                        "C_o": c_off, "C_prof": c_off.get("profiles", {}).get("business_name", "Partner C"),
                                                        "A_o": m_off
                                                    })
        if not loops:
            st.info("No 3-way circular loops found in the network right now. Try posting diverse offers and needs!")
        else:
            st.success(f"🌀 Agent discovered {len(loops)} circular trade loops!")
            for idx, loop in enumerate(loops):
                with st.container(border=True):
                    st.markdown(f"### 🌀 Loop #{idx+1}")
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.markdown("**1. You Receive**")
                        st.write(f"*{loop['B_o']['title']}*")
                        st.caption(f"From: {loop['B_prof']}")
                    with col2:
                        st.markdown("**2. They Receive**")
                        st.write(f"*{loop['C_o']['title']}*")
                        st.caption(f"From: {loop['C_prof']}")
                    with col3:
                        st.markdown("**3. You Provide**")
                        st.write(f"*{loop['A_o']['title']}*")
                        st.caption(f"To: {loop['C_prof']}")
                    
                    st.divider()
                    if st.button("🌀 Initiate Multi-Party Trade", key=f"loop_{idx}"):
                        st.toast("Multi-party trade loop queued!", icon="🌀")
    except Exception as e:
        st.error(f"Error running agent: {e}")


# -----------------------------------------------------------------------------
# 5. UI COMPONENTS (Map, Proposals, Feed)
# -----------------------------------------------------------------------------
def render_barter_map():
    st.subheader("🗺️ Geographic Barter Discovery Map")
    try:
        posts = supabase.table("posts").select("*, profiles(*)").execute().data or []
        map_data = [{"lat": float((p.get("profiles") or {}).get("latitude") or 45.5017), "lon": float((p.get("profiles") or {}).get("longitude") or -73.5673), "title": p["title"], "business_name": (p.get("profiles") or {}).get("business_name", "Business"), "category": p.get("category", "General"), "type": p.get("type") or p.get("post_type") or "Offer"} for p in posts]
        if map_data: st.map(DataFrame(map_data) if 'DataFrame' else pd.DataFrame(map_data), latitude="lat", longitude="lon", zoom=10, size=20)
        else: st.info("No mapped listings yet.")
    except Exception: pass

def render_trade_proposal_card(prop, is_incoming, user_id):
    target, offered = prop.get("target") or {}, prop.get("offered") or {}
    partner_prof = (prop.get("proposer") if is_incoming else prop.get("recipient")) or {}
    status = prop.get("status", "pending")

    with st.container(border=True):
        st.markdown(f"### {status.upper()} | {'From' if is_incoming else 'To'} {partner_prof.get('business_name', 'Business')}")
        col_left, col_right = st.columns(2)
        with col_left: st.markdown(f"**Their Item:** {offered.get('title') if is_incoming else target.get('title')}")
        with col_right: st.markdown(f"**Your Item:** {target.get('title') if is_incoming else offered.get('title')}")

        if status == "pending":
            if is_incoming:
                col_acc, col_dec, _ = st.columns([1, 1, 3])
                if col_acc.button("✅ Accept", key=f"acc_{prop['id']}", type="primary"):
                    supabase.table("trade_proposals").update({"status": "accepted"}).eq("id", prop["id"]).execute()
                    st.rerun()
                if col_dec.button("❌ Decline", key=f"dec_{prop['id']}"):
                    supabase.table("trade_proposals").update({"status": "declined"}).eq("id", prop["id"]).execute()
                    st.rerun()
            elif st.button("🚫 Cancel", key=f"cncl_{prop['id']}"):
                supabase.table("trade_proposals").update({"status": "cancelled"}).eq("id", prop["id"]).execute()
                st.rerun()

        if status in ["accepted", "completed"]:
            render_milestones_tracker(prop, user_id)
            render_chat_window(prop["id"], user_id, prop["proposer_id"] if is_incoming else prop["recipient_id"])

def render_trade_proposals(user_id):
    st.subheader("📬 Trade Proposals Inbox")
    tab_incoming, tab_outgoing = st.tabs(["📥 Received", "📤 Sent"])
    
    with tab_incoming:
        incoming = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*)").eq("recipient_id", user_id).order("created_at", desc=True).execute().data or []
        for prop in incoming: render_trade_proposal_card(prop, True, user_id)
    with tab_outgoing:
        outgoing = supabase.table("trade_proposals").select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), recipient:profiles!recipient_id(*)").eq("proposer_id", user_id).order("created_at", desc=True).execute().data or []
        for prop in outgoing: render_trade_proposal_card(prop, False, user_id)

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
            st.rerun()


# -----------------------------------------------------------------------------
# 6. MAIN APP DASHBOARD (BRANDED WITH 🌀)
# -----------------------------------------------------------------------------
def main_app():
    user = st.session_state.user
    unread_count = 0
    try:
        unread_count = len(supabase.table("notifications").select("id").eq("user_id", user.id).eq("is_read", False).execute().data or [])
    except Exception: pass

    with st.sidebar:
        st.title("🌀 TradeIt AI")
        st.caption("Autonomous Circular B2B Network")
        st.write(f"Logged in as:\n**{user.email}**")
        if unread_count > 0: st.warning(f"🔔 **{unread_count} Unread Notification(s)**")
        st.divider()
        if st.button("Sign Out", type="secondary"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.rerun()

    tabs = st.tabs(["🌐 Feed", "⚡ Semantic Match", "🌀 Circular Agent", "🗺️ Map", "➕ Post", "📋 Listings", f"📬 Inbox ({unread_count})", "🏢 Profile"])
    
    my_active_posts = []
    try: my_active_posts = supabase.table("posts").select("*").eq("user_id", user.id).execute().data or []
    except Exception: pass

    with tabs[0]:
        all_posts = supabase.table("posts").select("*, profiles(*)").order("created_at", desc=True).execute().data or []
        for post in all_posts:
            with st.container(border=True):
                st.markdown(f"### {post['title']}")
                st.caption(f"🏢 **{(post.get('profiles') or {}).get('business_name', 'Business')}**")
                if post["user_id"] != user.id:
                    with st.popover("🌀 Propose Trade"):
                        with st.form(key=f"prop_form_{post['id']}"):
                            opts = {p['title']: p["id"] for p in my_active_posts}
                            sel = st.selectbox("Offer item:", list(opts.keys())) if opts else None
                            if st.form_submit_button("Send Proposal", type="primary") and sel:
                                supabase.table("trade_proposals").insert({"proposer_id": user.id, "recipient_id": post["user_id"], "target_post_id": post["id"], "offered_post_id": opts[sel]}).execute()
                                st.rerun()

    with tabs[1]: render_smart_matches(user.id, my_active_posts)
    with tabs[2]: render_circular_trades(user.id, my_active_posts)
    with tabs[3]: render_barter_map()
    with tabs[4]:
        with st.form("create_post_form", clear_on_submit=True):
            p_type, title, desc, cat = st.selectbox("I want to...", ["Offer", "Need"]), st.text_input("Title"), st.text_area("Description"), st.text_input("Category")
            if st.form_submit_button("Publish Post", type="primary") and title:
                embedding = generate_embedding(f"{title} {desc} {cat}")
                post_data = {"user_id": user.id, "title": title, "type": p_type, "post_type": p_type, "description": desc, "category": cat if cat else "General"}
                if embedding: post_data["embedding"] = embedding
                supabase.table("posts").insert(post_data).execute()
                st.rerun()
    with tabs[5]:
        for p in my_active_posts:
            with st.container(border=True):
                st.write(f"**{p['title']}**")
                if st.button("🗑️ Delete", key=f"del_{p['id']}{p.get('created_at', '')}"):
                    supabase.table("posts").delete().eq("id", p["id"]).execute()
                    st.rerun()
    with tabs[6]: render_trade_proposals(user.id)
    with tabs[7]: render_business_profile(user.id)

if __name__ == "__main__":
    if not st.session_state.user:
        try:
            res = supabase.auth.get_session()
            if res and res.user: st.session_state.user = res.user
        except: pass
    if st.session_state.user: main_app()
    else:
        st.title("🌀 Welcome to TradeIt AI")
        st.caption("The Autonomous Circular B2B Barter Marketplace")
        auth_mode = st.radio("Choose Mode", ["Sign In", "Create Account"], horizontal=True)
        with st.form("auth_form"):
            email, password = st.text_input("Email Address"), st.text_input("Password", type="password")
            b_name = st.text_input("Business Name") if auth_mode == "Create Account" else None
            if st.form_submit_button(auth_mode, type="primary"):
                try:
                    if auth_mode == "Sign In":
                        st.session_state.user = supabase.auth.sign_in_with_password({"email": email, "password": password}).user
                        st.rerun()
                    elif b_name:
                        user = supabase.auth.sign_up({"email": email, "password": password}).user
                        if user:
                            supabase.table("profiles").upsert({"id": user.id, "business_name": b_name, "contact_email": email}).execute()
                            st.session_state.user = user
                            st.rerun()
                except Exception as e: st.error(f"Auth error: {e}")