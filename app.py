import os
import uuid
import pandas as pd
import streamlit as st
from supabase import create_client

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
# 2. HELPER FUNCTIONS FOR STORAGE, MEDIA, CHAT & NOTIFICATIONS
# -----------------------------------------------------------------------------
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

def send_notification(user_id, title, message):
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message
        }).execute()
    except Exception:
        pass

def render_chat_window(proposal_id, user_id, recipient_id):
    try:
        msgs_res = supabase.table("messages") \
            .select("*, sender:profiles(business_name)") \
            .eq("proposal_id", proposal_id) \
            .order("created_at", asc=True) \
            .execute()
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

        # Add New Milestone Form
        with st.popover("➕ Add Milestone", use_container_width=False):
            with st.form(key=f"add_ms_form_{proposal_id}"):
                ms_title = st.text_input("Milestone Title", placeholder="e.g. Initial Wireframe Approval")
                submit_ms = st.form_submit_button("Add Milestone", type="primary")
                if submit_ms and ms_title.strip():
                    supabase.table("trade_milestones").insert({
                        "proposal_id": proposal_id,
                        "title": ms_title.strip()
                    }).execute()
                    st.toast("Milestone added!", icon="🎯")
                    st.rerun()

    except Exception as e:
        st.error(f"Error loading milestones: {e}")


# -----------------------------------------------------------------------------
# 4. NOTIFICATION FEED COMPONENT
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


# -----------------------------------------------------------------------------
# 5. SMART MATCHMAKING & ANALYTICS MODULES
# -----------------------------------------------------------------------------
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
                if need_cat and need_cat == other_cat:
                    match_score += 60
                if any(word in other_title for word in need_title.split() if len(word) > 3):
                    match_score += 35

                if match_score >= 50:
                    matches.append({
                        "my_need": my_need,
                        "other_offer": other_post,
                        "score": min(match_score, 98)
                    })

        matches.sort(key=lambda x: x["score"], reverse=True)

        if not matches:
            st.warning("No high-confidence matches found yet. Try posting more specific categories or listing additional Needs.")
        else:
            st.success(f"🎯 Found **{len(matches)}** high-compatibility barter matches for your company!")
            for match in matches:
                need = match["my_need"]
                offer = match["other_offer"]
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
                            try:
                                supabase.table("trade_proposals").insert({
                                    "proposer_id": user_id,
                                    "recipient_id": offer["user_id"],
                                    "target_post_id": offer["id"],
                                    "offered_post_id": need["id"],
                                    "message": f"Smart Match Connection: We are interested in swapping our {need['title']} listing for your {offer['title']}!"
                                }).execute()

                                send_notification(
                                    user_id=offer["user_id"],
                                    title="🚀 New Smart Match Proposal Received",
                                    message=f"A company proposed a trade for your listing '{offer['title']}'."
                                )

                                st.toast("Trade proposal sent to partner!", icon="🚀")
                                st.rerun()
                            except Exception as e:
                                st.error(f"Error sending proposal: {e}")

    except Exception as e:
        st.error(f"Error executing matchmaker: {e}")

def render_analytics_dashboard(user_id):
    st.subheader("📊 Barter Performance & Accounting ROI Dashboard")
    
    try:
        props_res = supabase.table("trade_proposals") \
            .select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*), recipient:profiles!recipient_id(*)") \
            .or_(f"proposer_id.eq.{user_id},recipient_id.eq.{user_id}") \
            .execute()
        proposals = props_res.data or []

        posts_res = supabase.table("posts").select("*").eq("user_id", user_id).execute()
        user_posts = posts_res.data or []

        completed_trades = [p for p in proposals if p.get("status") in ["accepted", "completed"]]
        completed_count = len(completed_trades)
        pending_count = sum(1 for p in proposals if p.get("status") == "pending")
        est_cash_saved = completed_count * 1250

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Active Listings", len(user_posts))
        with col2:
            st.metric("Pending Proposals", pending_count)
        with col3:
            st.metric("Trades Completed", completed_count)
        with col4:
            st.metric("Est. Cash Saved", f"${est_cash_saved:,} CAD", delta="Barter ROI")

        st.divider()

        st.markdown("### 📄 Corporate Tax & Audit CSV Exporter")
        st.caption("Generate an official ledger of all completed barter transactions for corporate income tax reporting.")

        if completed_trades:
            export_rows = []
            for t in completed_trades:
                target = t.get("target") or {}
                offered = t.get("offered") or {}
                proposer = t.get("proposer") or {}
                recipient = t.get("recipient") or {}
                topup = float(t.get("cash_topup_amount") or 0.0)

                export_rows.append({
                    "Transaction_ID": t["id"],
                    "Date": t["created_at"][:10],
                    "Proposer_Company": proposer.get("business_name"),
                    "Recipient_Company": recipient.get("business_name"),
                    "Offered_Service": offered.get("title"),
                    "Received_Service": target.get("title"),
                    "Cash_TopUp_CAD": topup,
                    "Status": t["status"].upper(),
                    "Est_Valuation_CAD": 1250.00 + topup
                })

            df_export = pd.DataFrame(export_rows)
            st.dataframe(df_export, use_container_width=True)

            csv_data = df_export.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Download Barter Tax Ledger (.CSV)",
                data=csv_data,
                file_name=f"TradeIt_Barter_Tax_Ledger_{user_id[:8]}.csv",
                mime="text/csv",
                type="primary"
            )
        else:
            st.info("No completed barter trades logged yet. Complete trades to unlock your tax ledger.")

    except Exception as e:
        st.error(f"Error loading analytics: {e}")


# -----------------------------------------------------------------------------
# 6. ADMIN & MODERATION PANEL
# -----------------------------------------------------------------------------
def render_admin_panel():
    st.subheader("🛡️ Platform Admin & Moderation Operations")
    
    try:
        all_posts_res = supabase.table("posts").select("*, profiles(*)").execute()
        all_posts = all_posts_res.data or []

        all_profiles_res = supabase.table("profiles").select("*").execute()
        all_profiles = all_profiles_res.data or []

        tab_mod_posts, tab_mod_users = st.tabs(["📌 Moderate Listings", "🏢 Company Verification"])

        with tab_mod_posts:
            st.caption(f"Managing **{len(all_posts)}** total listings across the marketplace.")
            for post in all_posts:
                prof = post.get("profiles") or {}
                with st.container(border=True):
                    col_info, col_btn = st.columns([4, 1])
                    with col_info:
                        st.markdown(f"**{post['title']}** (By: {prof.get('business_name', 'Unknown')})")
                        st.caption(f"Category: {post.get('category')} | Created: {post['created_at'][:10]}")
                        st.write(post.get("description", "")[:120] + "...")
                    with col_btn:
                        if st.button("🗑️ Remove", key=f"admin_del_{post['id']}", type="secondary"):
                            supabase.table("posts").delete().eq("id", post["id"]).execute()
                            st.toast("Listing removed by admin", icon="🛡️")
                            st.rerun()

        with tab_mod_users:
            st.caption(f"Total Registered Businesses: **{len(all_profiles)}**")
            for p in all_profiles:
                with st.container(border=True):
                    col_u_info, col_u_btn = st.columns([3, 1])
                    with col_u_info:
                        v_badge = "✅ Verified" if p.get("is_verified") else "⏳ Unverified"
                        st.markdown(f"**{p.get('business_name', 'Business')}** ({v_badge})")
                        st.caption(f"Email: {p.get('contact_email')} | Location: {p.get('location')}")
                    with col_u_btn:
                        new_status = not p.get("is_verified", False)
                        btn_label = "Revoke" if p.get("is_verified") else "Verify"
                        if st.button(btn_label, key=f"admin_verify_{p['id']}"):
                            supabase.table("profiles").update({"is_verified": new_status}).eq("id", p["id"]).execute()
                            
                            send_notification(
                                user_id=p["id"],
                                title="🏢 Verification Status Updated",
                                message=f"Your business profile verification status has been updated to: {btn_label}d."
                            )

                            st.toast("Updated verification status!", icon="✅")
                            st.rerun()

    except Exception as e:
        st.error(f"Admin Panel Error: {e}")


# -----------------------------------------------------------------------------
# 7. AUTHENTICATION MODULE
# -----------------------------------------------------------------------------
def render_auth_page():
    st.title("🤝 Welcome to TradeIt")
    st.caption("The B2B Barter Marketplace for Business Services & Resources")
    
    auth_mode = st.radio("Choose Mode", ["Sign In", "Create Account"], horizontal=True)
    
    with st.form("auth_form", clear_on_submit=False):
        email = st.text_input("Email Address")
        password = st.text_input("Password", type="password")
        
        business_name = None
        location = "Montreal, QC"
        if auth_mode == "Create Account":
            business_name = st.text_input("Business Name")
            location = st.text_input("Location", value="Montreal, QC")
            
        submit_btn = st.form_submit_button(auth_mode, type="primary")
        
        if submit_btn:
            if not email or not password:
                st.error("Please fill in both email and password.")
                return
            
            try:
                if auth_mode == "Sign In":
                    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                    st.session_state.user = res.user
                    st.success("Signed in successfully!")
                    st.rerun()
                else:
                    if not business_name:
                        st.error("Please enter your Business Name.")
                        return
                    
                    res = supabase.auth.sign_up({"email": email, "password": password})
                    user = res.user
                    
                    if user:
                        supabase.table("profiles").upsert({
                            "id": user.id,
                            "business_name": business_name,
                            "contact_email": email,
                            "location": location
                        }).execute()
                        
                        st.session_state.user = user
                        st.success("Account created successfully!")
                        st.rerun()
            except Exception as e:
                st.error(f"Authentication error: {e}")


# -----------------------------------------------------------------------------
# 8. MY LISTINGS COMPONENT
# -----------------------------------------------------------------------------
def render_my_listings(user_id):
    st.subheader("📋 My Active Listings")
    
    try:
        response = supabase.table("posts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        my_posts = response.data
    except Exception as e:
        st.error(f"Error fetching your listings: {e}")
        return

    if not my_posts:
        st.info("You haven't posted any barter offers or needs yet. Head to 'Create Post' to publish one!")
        return

    for post in my_posts:
        p_type = post.get("type") or post.get("post_type") or "Offer"
        badge = "🟢 OFFER" if p_type == "Offer" else "🔵 NEED"
        
        with st.container(border=True):
            col_content, col_actions = st.columns([3, 1])
            
            with col_content:
                st.markdown(f"### {badge}: {post['title']}")
                st.caption(f"**Category:** {post.get('category', 'General')} | **Created:** {post['created_at'][:10]}")
                st.write(post.get("description", ""))
                
                if post.get("image_url"):
                    render_media(post["image_url"], width=250)

            with col_actions:
                st.write("**Actions**")
                
                with st.popover("✏️ Edit"):
                    st.markdown(f"**Edit Post:** {post['title']}")
                    with st.form(key=f"edit_form_{post['id']}"):
                        edit_title = st.text_input("Title", value=post["title"])
                        edit_type = st.selectbox(
                            "Type", 
                            ["Offer", "Need"], 
                            index=0 if p_type == "Offer" else 1
                        )
                        edit_category = st.text_input("Category", value=post.get("category", "General"))
                        edit_desc = st.text_area("Description", value=post.get("description", ""))
                        
                        new_uploaded_file = st.file_uploader(
                            "Replace Media File", 
                            type=["png", "jpg", "jpeg", "webp", "mp4", "mov", "webm"],
                            key=f"file_edit_{post['id']}"
                        )
                        edit_image_url = st.text_input("Or Media URL", value=post.get("image_url") or "", key=f"url_edit_{post['id']}")
                        
                        save_btn = st.form_submit_button("Save Changes", type="primary")
                        if save_btn:
                            try:
                                final_media_url = post.get("image_url")
                                
                                if new_uploaded_file:
                                    final_media_url = upload_file_to_supabase(new_uploaded_file, user_id)
                                elif edit_image_url:
                                    final_media_url = edit_image_url
                                
                                supabase.table("posts").update({
                                    "title": edit_title,
                                    "type": edit_type,
                                    "post_type": edit_type,
                                    "category": edit_category,
                                    "description": edit_desc,
                                    "image_url": final_media_url
                                }).eq("id", post["id"]).execute()
                                
                                st.toast("Post updated successfully!", icon="✅")
                                st.rerun()
                            except Exception as err:
                                st.error(f"Failed to update post: {err}")

                if st.button("🗑️ Delete", key=f"del_{post['id']}", type="secondary"):
                    try:
                        supabase.table("posts").delete().eq("id", post["id"]).execute()
                        st.toast("Post deleted!", icon="🗑️")
                        st.rerun()
                    except Exception as err:
                        st.error(f"Failed to delete post: {err}")


# -----------------------------------------------------------------------------
# 9. TRADE PROPOSALS COMPONENT
# -----------------------------------------------------------------------------
def render_trade_proposals(user_id):
    st.subheader("📬 Trade Proposals Inbox")
    
    tab_incoming, tab_outgoing = st.tabs(["📥 Received Proposals", "📤 Sent Proposals"])
    
    # --- INCOMING PROPOSALS ---
    with tab_incoming:
        try:
            inc_res = supabase.table("trade_proposals") \
                .select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), proposer:profiles!proposer_id(*)") \
                .eq("recipient_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            incoming = inc_res.data or []
            
            if not incoming:
                st.info("No incoming trade proposals yet.")
            else:
                for prop in incoming:
                    target = prop.get("target") or {}
                    offered = prop.get("offered") or {}
                    proposer = prop.get("proposer") or {}
                    status = prop.get("status", "pending")
                    cash_topup = float(prop.get("cash_topup_amount") or 0.0)
                    cash_payer = prop.get("cash_payer_id")
                    
                    status_badge = {
                        "pending": "⏳ PENDING",
                        "accepted": "✅ ACCEPTED",
                        "declined": "❌ DECLINED",
                        "cancelled": "🚫 CANCELLED",
                        "completed": "🏆 COMPLETED"
                    }.get(status, status.upper())

                    with st.container(border=True):
                        st.markdown(f"### {status_badge} | Offer from {proposer.get('business_name', 'Business')}")
                        st.caption(f"Received: {prop['created_at'][:10]} | Contact: {proposer.get('contact_email', 'N/A')}")
                        
                        col_target, col_swap, col_offered = st.columns([2, 1, 2])
                        
                        with col_target:
                            st.markdown(f"**Your Item:** {target.get('title', 'Unknown Listing')}")
                            st.caption(target.get('description', '')[:100] + "...")
                            
                        with col_swap:
                            st.markdown("### 🔄 IN EXCHANGE FOR")
                            
                        with col_offered:
                            st.markdown(f"**Their Offered Item:** {offered.get('title', 'Unknown Listing')}")
                            st.caption(offered.get('description', '')[:100] + "...")

                        if cash_topup > 0:
                            payer_name = "Proposer" if cash_payer == prop["proposer_id"] else "You"
                            st.info(f"💵 **Cash Top-Up Included:** ${cash_topup:,.2f} CAD paid by {payer_name} to balance valuation.")
                        
                        if prop.get("message"):
                            st.caption(f"💬 **Proposer's Note:** {prop['message']}")
                            
                        if status == "pending":
                            col_acc, col_dec, _ = st.columns([1, 1, 3])
                            with col_acc:
                                if st.button("✅ Accept Trade", key=f"acc_{prop['id']}", type="primary"):
                                    supabase.table("trade_proposals").update({"status": "accepted"}).eq("id", prop["id"]).execute()
                                    
                                    send_notification(
                                        user_id=prop["proposer_id"],
                                        title="🎉 Trade Proposal Accepted!",
                                        message=f"Your trade proposal for '{target.get('title')}' was accepted."
                                    )

                                    st.toast("Trade proposal accepted!", icon="🎉")
                                    st.rerun()
                            with col_dec:
                                if st.button("❌ Decline Trade", key=f"dec_{prop['id']}", type="secondary"):
                                    supabase.table("trade_proposals").update({"status": "declined"}).eq("id", prop["id"]).execute()
                                    
                                    send_notification(
                                        user_id=prop["proposer_id"],
                                        title="ℹ️ Trade Proposal Declined",
                                        message=f"Your trade proposal for '{target.get('title')}' was declined."
                                    )

                                    st.toast("Trade proposal declined.", icon="ℹ️")
                                    st.rerun()

                        if status in ["accepted", "completed"]:
                            st.success("🎉 **Trade Agreement Active!** Contact details, chat & milestones unlocked below.")
                            
                            with st.expander("📄 View Formal Barter Summary & Contract", expanded=False):
                                st.markdown(f"### 🤝 Trade Agreement #{prop['id'][:8].upper()}")
                                st.caption(f"**Date Executed:** {prop['created_at'][:10]}")
                                
                                col_p1, col_p2 = st.columns(2)
                                with col_p1:
                                    st.markdown("#### Party A (Proposer)")
                                    st.write(f"**Company:** {proposer.get('business_name', 'N/A')}")
                                    st.write(f"**Email:** {proposer.get('contact_email', 'N/A')}")
                                    st.write(f"**Offered Scope:** {offered.get('title', 'N/A')}")
                                    
                                with col_p2:
                                    st.markdown("#### Party B (Recipient - You)")
                                    st.write(f"**Company:** Your Business")
                                    st.write(f"**Agreed Scope:** {target.get('title', 'N/A')}")
                                    
                                agreement_text = f"""====================================================================
TRADEIT B2B BARTER AGREEMENT SUMMARY
Agreement Reference: {prop['id']}
Date: {prop['created_at'][:10]}
====================================================================
PARTY A: {proposer.get('business_name')} ({proposer.get('contact_email')})
PARTY B: Recipient Business
CASH TOP-UP ADJUSTMENT: ${cash_topup:,.2f} CAD
===================================================================="""
                                st.download_button("📥 Download Contract (.txt)", agreement_text, file_name=f"TradeIt_Agreement_{prop['id'][:8]}.txt", key=f"dl_agreed_{prop['id']}")
                            
                            st.divider()
                            # Deliverable Milestones Section
                            render_milestones_tracker(prop, user_id)
                            st.divider()
                            # Chat Section
                            render_chat_window(prop["id"], user_id, prop["proposer_id"])
                                    
        except Exception as e:
            st.error(f"Error loading received proposals: {e}")

    # --- OUTGOING PROPOSALS ---
    with tab_outgoing:
        try:
            out_res = supabase.table("trade_proposals") \
                .select("*, target:posts!target_post_id(*), offered:posts!offered_post_id(*), recipient:profiles!recipient_id(*)") \
                .eq("proposer_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            outgoing = out_res.data or []
            
            if not outgoing:
                st.info("You haven't sent any trade proposals yet.")
            else:
                for prop in outgoing:
                    target = prop.get("target") or {}
                    offered = prop.get("offered") or {}
                    recipient = prop.get("recipient") or {}
                    status = prop.get("status", "pending")
                    cash_topup = float(prop.get("cash_topup_amount") or 0.0)
                    
                    status_badge = {
                        "pending": "⏳ PENDING",
                        "accepted": "✅ ACCEPTED",
                        "declined": "❌ DECLINED",
                        "cancelled": "🚫 CANCELLED",
                        "completed": "🏆 COMPLETED"
                    }.get(status, status.upper())

                    with st.container(border=True):
                        st.markdown(f"### {status_badge} | Sent to {recipient.get('business_name', 'Business')}")
                        st.caption(f"Sent: {prop['created_at'][:10]}")
                        
                        col_offered, col_swap, col_target = st.columns([2, 1, 2])
                        with col_offered:
                            st.markdown(f"**Your Offered Item:** {offered.get('title', 'Unknown Listing')}")
                        with col_swap:
                            st.markdown("### 🔄 FOR")
                        with col_target:
                            st.markdown(f"**Target Listing:** {target.get('title', 'Unknown Listing')}")

                        if cash_topup > 0:
                            st.info(f"💵 **Cash Top-Up Included:** ${cash_topup:,.2f} CAD balancing adjustment")

                        if status == "pending":
                            if st.button("🚫 Cancel Proposal", key=f"cncl_{prop['id']}", type="secondary"):
                                supabase.table("trade_proposals").update({"status": "cancelled"}).eq("id", prop["id"]).execute()
                                st.toast("Proposal cancelled.", icon="🗑️")
                                st.rerun()

                        if status in ["accepted", "completed"]:
                            st.success("🎉 **Trade Accepted by Partner!** Contact email, chat & milestones unlocked below.")
                            st.write(f"📧 **Partner Email:** {recipient.get('contact_email', 'N/A')}")
                            st.divider()
                            # Deliverable Milestones Section
                            render_milestones_tracker(prop, user_id)
                            st.divider()
                            # Chat Section
                            render_chat_window(prop["id"], user_id, prop["recipient_id"])
                                
        except Exception as e:
            st.error(f"Error loading sent proposals: {e}")


# -----------------------------------------------------------------------------
# 10. BUSINESS PROFILE MODULE
# -----------------------------------------------------------------------------
def render_business_profile(user_id):
    st.subheader("🏢 Business Profile & Brand Showcase")
    
    try:
        prof_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        profile_data = prof_res.data[0] if prof_res.data else {}
    except Exception as e:
        st.error(f"Error loading profile data: {e}")
        profile_data = {}

    tab_view_prof, tab_edit_prof = st.tabs(["👁️ View Profile Showcase", "✏️ Edit Company Details"])

    with tab_view_prof:
        with st.container(border=True):
            col_logo, col_info = st.columns([1, 3])
            
            with col_logo:
                if profile_data.get("logo_url"):
                    st.image(profile_data["logo_url"], width=180)
                else:
                    st.info("📷 No logo uploaded yet")

            with col_info:
                v_badge = " ✅ Verified Business" if profile_data.get("is_verified") else ""
                st.markdown(f"## {profile_data.get('business_name', 'Business Name')}{v_badge}")
                st.caption(f"📍 **Location:** {profile_data.get('location', 'Not set')} | 📧 **Email:** {profile_data.get('contact_email', 'Not set')}")
                
                website = profile_data.get("website")
                if website:
                    clean_url = website if website.startswith("http") else f"https://{website}"
                    st.markdown(f"🌐 **Website:** [{website}]({clean_url})")

                st.markdown("### About Our Business")
                st.write(profile_data.get("bio") or "*No business description provided yet.*")

    with tab_edit_prof:
        with st.form("edit_profile_form"):
            st.markdown("### Edit Business Information")
            edit_biz_name = st.text_input("Business Name", value=profile_data.get("business_name") or "")
            edit_contact_email = st.text_input("Contact Email", value=profile_data.get("contact_email") or "")
            edit_location = st.text_input("Location", value=profile_data.get("location") or "Montreal, QC")
            edit_website = st.text_input("Website URL", value=profile_data.get("website") or "")
            edit_bio = st.text_area("Business Bio", value=profile_data.get("bio") or "")
            uploaded_logo = st.file_uploader("Select Logo Image", type=["png", "jpg", "jpeg", "webp"])
            
            save_profile_btn = st.form_submit_button("Save Profile", type="primary")
            if save_profile_btn:
                try:
                    final_logo_url = profile_data.get("logo_url")
                    if uploaded_logo:
                        final_logo_url = upload_file_to_supabase(uploaded_logo, user_id, folder="logos")

                    supabase.table("profiles").upsert({
                        "id": user_id,
                        "business_name": edit_biz_name,
                        "contact_email": edit_contact_email,
                        "location": edit_location,
                        "website": edit_website,
                        "bio": edit_bio,
                        "logo_url": final_logo_url
                    }).execute()
                    
                    st.toast("Profile updated successfully!", icon="🎉")
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to update profile: {e}")


# -----------------------------------------------------------------------------
# 11. MAIN APPLICATION DASHBOARD
# -----------------------------------------------------------------------------
def main_app():
    user = st.session_state.user
    
    unread_count = 0
    try:
        notif_res = supabase.table("notifications").select("id").eq("user_id", user.id).eq("is_read", False).execute()
        if notif_res.data:
            unread_count = len(notif_res.data)
    except Exception:
        pass

    is_admin = False
    try:
        my_prof_res = supabase.table("profiles").select("is_admin").eq("id", user.id).execute()
        if my_prof_res.data:
            is_admin = my_prof_res.data[0].get("is_admin", False)
    except Exception:
        pass

    with st.sidebar:
        st.title("🤝 TradeIt B2B")
        st.write(f"Logged in as:\n**{user.email}**")
        if unread_count > 0:
            st.warning(f"🔔 **{unread_count} Unread Notification(s)**")
        if is_admin:
            st.success("🛡️ Admin Status Active")
        st.divider()
        if st.button("Sign Out", type="secondary"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.rerun()

    notif_label = f"🔔 Notifications ({unread_count})" if unread_count > 0 else "🔔 Notifications"
    tabs_list = ["🌐 Barter Feed", "⚡ Smart Matches", "➕ Create Post", "📋 My Listings", "📬 Trade Proposals", notif_label, "📊 ROI Analytics", "🏢 Business Profile"]
    if is_admin:
        tabs_list.append("🛡️ Admin Panel")

    tabs = st.tabs(tabs_list)
    
    tab_feed = tabs[0]
    tab_match = tabs[1]
    tab_create = tabs[2]
    tab_my_listings = tabs[3]
    tab_proposals = tabs[4]
    tab_notifs = tabs[5]
    tab_analytics = tabs[6]
    tab_profile = tabs[7]

    my_posts_res = supabase.table("posts").select("*").eq("user_id", user.id).execute()
    my_active_posts = my_posts_res.data or []

    # --- TAB 1: BARTER FEED ---
    with tab_feed:
        st.subheader("Browse Barter Opportunities")
        try:
            posts_query = supabase.table("posts").select("*, profiles(*)").order("created_at", desc=True).execute()
            all_posts = posts_query.data or []

            if not all_posts:
                st.info("No barter posts available yet. Be the first to post an offer or need!")
            else:
                with st.container(border=True):
                    col_search, col_cat, col_type = st.columns([2, 1, 1])
                    with col_search:
                        search_term = st.text_input("🔍 Search", placeholder="Search by title, description, or business...")
                    with col_cat:
                        existing_cats = sorted(list(set([p.get("category").strip() for p in all_posts if p.get("category")])))
                        cat_options = ["All Categories"] + (existing_cats if existing_cats else ["Marketing", "Legal", "IT", "Design", "Consulting", "Finance"])
                        selected_category = st.selectbox("🏷️ Category", options=cat_options)
                    with col_type:
                        selected_type = st.radio("📌 Type", options=["All", "Offers", "Needs"], horizontal=True)

                filtered_posts = all_posts
                if search_term.strip():
                    term = search_term.lower().strip()
                    filtered_posts = [
                        p for p in filtered_posts
                        if term in p.get("title", "").lower()
                        or term in p.get("description", "").lower()
                        or term in p.get("category", "").lower()
                        or term in (p.get("profiles") or {}).get("business_name", "").lower()
                    ]

                if selected_category != "All Categories":
                    filtered_posts = [p for p in filtered_posts if (p.get("category") or "").lower() == selected_category.lower()]

                if selected_type == "Offers":
                    filtered_posts = [p for p in filtered_posts if (p.get("type") or p.get("post_type")) == "Offer"]
                elif selected_type == "Needs":
                    filtered_posts = [p for p in filtered_posts if (p.get("type") or p.get("post_type")) == "Need"]

                st.caption(f"Showing **{len(filtered_posts)}** of **{len(all_posts)}** total barter listings")
                
                for post in filtered_posts:
                    profile = post.get("profiles") or {}
                    biz_name = profile.get("business_name", "Business Member")
                    contact = profile.get("contact_email", user.email)
                    location = profile.get("location", "Montreal, QC")
                    logo = profile.get("logo_url")
                    v_badge = " ✅" if profile.get("is_verified") else ""
                    
                    p_type = post.get("type") or post.get("post_type") or "Offer"
                    badge = "🟢 OFFER" if p_type == "Offer" else "🔵 NEED"
                    is_own_post = (post["user_id"] == user.id)
                    
                    with st.container(border=True):
                        col_header_left, col_header_right = st.columns([3, 1])
                        with col_header_left:
                            st.markdown(f"### {badge}: {post['title']}")
                            st.caption(f"🏢 **{biz_name}**{v_badge} | 📍 {location} | 🏷️ **Category:** {post.get('category', 'General')}")
                        with col_header_right:
                            if logo:
                                st.image(logo, width=80)
                        
                        st.write(post.get("description", ""))
                        if post.get("image_url"):
                            render_media(post["image_url"], width=350)
                            
                        st.divider()
                        col_mail, col_prop = st.columns([1, 1])
                        with col_mail:
                            st.markdown(f"📧 [{contact}](mailto:{contact}?subject=TradeIt%20Inquiry:%20{post['title']})")
                        with col_prop:
                            if is_own_post:
                                st.caption("📌 *Your listing*")
                            else:
                                with st.popover("🤝 Propose Trade", use_container_width=True):
                                    if not my_active_posts:
                                        st.warning("Create a listing under **'➕ Create Post'** before proposing a trade!")
                                    else:
                                        with st.form(key=f"prop_form_{post['id']}"):
                                            post_options = {f"{p['title']} ({(p.get('type') or p.get('post_type') or 'Offer')})": p["id"] for p in my_active_posts}
                                            selected_label = st.selectbox("Select item to offer:", list(post_options.keys()))
                                            
                                            st.caption("💵 **Optional Cash Top-Up (for value balancing):**")
                                            cash_topup_val = st.number_input("Cash Amount (CAD)", min_value=0.0, step=50.0, value=0.0)
                                            cash_payer_choice = st.radio("Cash paid by:", ["I will pay this cash top-up", "Partner should pay this cash top-up"], horizontal=True)
                                            
                                            proposal_msg = st.text_area("Pitch note:", placeholder="Hi! We would love to swap...")
                                            submit_prop = st.form_submit_button("Send Proposal", type="primary")
                                            
                                            if submit_prop:
                                                offered_id = post_options[selected_label]
                                                payer_id = user.id if "I will pay" in cash_payer_choice else post["user_id"]
                                                
                                                supabase.table("trade_proposals").insert({
                                                    "proposer_id": user.id,
                                                    "recipient_id": post["user_id"],
                                                    "target_post_id": post["id"],
                                                    "offered_post_id": offered_id,
                                                    "cash_topup_amount": cash_topup_val,
                                                    "cash_payer_id": payer_id if cash_topup_val > 0 else None,
                                                    "message": proposal_msg
                                                }).execute()

                                                send_notification(
                                                    user_id=post["user_id"],
                                                    title="📬 New Trade Proposal Received",
                                                    message=f"You received a new barter proposal for '{post['title']}'."
                                                )

                                                st.toast("Trade proposal sent!", icon="🚀")
                                                st.rerun()

        except Exception as e:
            st.error(f"Error loading barter feed: {e}")

    # --- TAB 2: SMART MATCHES ---
    with tab_match:
        render_smart_matches(user.id, my_active_posts)

    # --- TAB 3: CREATE POST ---
    with tab_create:
        st.subheader("Post an Offer or Need")
        with st.form("create_post_form", clear_on_submit=True):
            post_type = st.selectbox("I want to...", ["Offer", "Need"])
            title = st.text_input("Title", placeholder="e.g., SEO Strategy in exchange for Legal Consulting")
            category = st.text_input("Category", placeholder="e.g., Marketing, Legal, IT, Design")
            description = st.text_area("Description")
            uploaded_file = st.file_uploader("Upload Media File", type=["png", "jpg", "jpeg", "webp", "mp4", "mov", "webm"])
            image_url_input = st.text_input("Or paste external Media URL")
            
            submit_post = st.form_submit_button("Publish Post", type="primary")
            if submit_post and title and description:
                media_url = upload_file_to_supabase(uploaded_file, user.id) if uploaded_file else image_url_input
                supabase.table("posts").insert({
                    "user_id": user.id,
                    "title": title,
                    "type": post_type,
                    "post_type": post_type,
                    "category": category if category else "General",
                    "description": description,
                    "image_url": media_url
                }).execute()
                st.toast("Post published!", icon="🚀")
                st.rerun()

    # --- TAB 4: MY LISTINGS ---
    with tab_my_listings:
        render_my_listings(user.id)

    # --- TAB 5: TRADE PROPOSALS ---
    with tab_proposals:
        render_trade_proposals(user.id)

    # --- TAB 6: NOTIFICATIONS ---
    with tab_notifs:
        render_notifications_feed(user.id)

    # --- TAB 7: ROI ANALYTICS ---
    with tab_analytics:
        render_analytics_dashboard(user.id)

    # --- TAB 8: BUSINESS PROFILE ---
    with tab_profile:
        render_business_profile(user.id)

    # --- TAB 9: ADMIN PANEL (IF APPLICABLE) ---
    if is_admin:
        with tabs[8]:
            render_admin_panel()


# -----------------------------------------------------------------------------
# 12. ENTRY POINT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    if not st.session_state.user:
        try:
            session_resp = supabase.auth.get_session()
            if session_resp and session_resp.user:
                st.session_state.user = session_resp.user
        except Exception:
            pass

    if st.session_state.user:
        main_app()
    else:
        render_auth_page()