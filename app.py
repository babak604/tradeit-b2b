import os
import uuid
import streamlit as st
from supabase import create_client

# -----------------------------------------------------------------------------
# 1. CONFIGURATION & CREDENTIALS
# -----------------------------------------------------------------------------
HARDCODED_SUPABASE_URL = "https://udwmxzbpmkhimzctoemg.supabase.co"
HARDCODED_SUPABASE_KEY = ""  # <--- PASTE YOUR ANON KEY HERE IF NEEDED

st.set_page_config(
    page_title="TradeIt - B2B Barter Marketplace",
    page_icon="🤝",
    layout="wide"
)

# Load variables from .env.local if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
    load_dotenv()
except ImportError:
    pass

# Retrieve Supabase credentials safely
SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or (st.secrets.get("SUPABASE_URL") if hasattr(st, "secrets") else None)
    or (st.secrets.get("NEXT_PUBLIC_SUPABASE_URL") if hasattr(st, "secrets") else None)
    or HARDCODED_SUPABASE_URL
)

SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or (st.secrets.get("SUPABASE_KEY") if hasattr(st, "secrets") else None)
    or (st.secrets.get("SUPABASE_ANON_KEY") if hasattr(st, "secrets") else None)
    or (st.secrets.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") if hasattr(st, "secrets") else None)
    or HARDCODED_SUPABASE_KEY
)

if not SUPABASE_KEY:
    st.error("⚠️ **Supabase Anon Key missing!**")
    st.info("Please paste your anon key directly into line 9 of `app.py` or set `SUPABASE_KEY` in `.env.local`.")
    st.stop()

@st.cache_resource
def get_supabase_client():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase_client()

# Session State Initialization
if "user" not in st.session_state:
    st.session_state.user = None


# -----------------------------------------------------------------------------
# 2. HELPER FUNCTIONS FOR STORAGE & MEDIA RENDERING
# -----------------------------------------------------------------------------
def upload_file_to_supabase(uploaded_file, user_id, folder="media"):
    """Uploads a file to the 'barter-media' Supabase Storage bucket."""
    try:
        file_bytes = uploaded_file.getvalue()
        file_ext = uploaded_file.name.split(".")[-1].lower()
        file_path = f"{folder}/{user_id}/{uuid.uuid4().hex}.{file_ext}"

        supabase.storage.from_("barter-media").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": uploaded_file.type}
        )

        public_url = supabase.storage.from_("barter-media").get_public_url(file_path)
        return public_url
    except Exception as e:
        st.error(f"Error uploading file to storage: {e}")
        return None

def render_media(url, width=350):
    """Dynamically renders images or videos based on file extension."""
    if not url:
        return
    
    video_extensions = [".mp4", ".mov", ".webm", ".m4v", ".mkv"]
    is_video = any(ext in url.lower() for ext in video_extensions)
    
    if is_video:
        st.video(url)
    else:
        st.image(url, width=width)


# -----------------------------------------------------------------------------
# 3. AUTHENTICATION MODULE
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
# 4. MY LISTINGS COMPONENT
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
                        
                        st.caption("Upload new media to replace existing:")
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
# 5. TRADE PROPOSALS COMPONENT
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
                    
                    status_badge = {
                        "pending": "⏳ PENDING",
                        "accepted": "✅ ACCEPTED",
                        "declined": "❌ DECLINED",
                        "cancelled": "🚫 CANCELLED"
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
                        
                        if prop.get("message"):
                            st.info(f"💬 **Proposer's Note:** {prop['message']}")
                            
                        if status == "pending":
                            col_acc, col_dec, _ = st.columns([1, 1, 3])
                            with col_acc:
                                if st.button("✅ Accept Trade", key=f"acc_{prop['id']}", type="primary"):
                                    supabase.table("trade_proposals").update({"status": "accepted"}).eq("id", prop["id"]).execute()
                                    st.toast("Trade proposal accepted!", icon="🎉")
                                    st.rerun()
                            with col_dec:
                                if st.button("❌ Decline Trade", key=f"dec_{prop['id']}", type="secondary"):
                                    supabase.table("trade_proposals").update({"status": "declined"}).eq("id", prop["id"]).execute()
                                    st.toast("Trade proposal declined.", icon="ℹ️")
                                    st.rerun()
                                    
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
                    
                    status_badge = {
                        "pending": "⏳ PENDING",
                        "accepted": "✅ ACCEPTED",
                        "declined": "❌ DECLINED",
                        "cancelled": "🚫 CANCELLED"
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

                        if prop.get("message"):
                            st.caption(f"💬 Your Note: {prop['message']}")
                            
                        if status == "pending":
                            if st.button("🚫 Cancel Proposal", key=f"cncl_{prop['id']}", type="secondary"):
                                supabase.table("trade_proposals").update({"status": "cancelled"}).eq("id", prop["id"]).execute()
                                st.toast("Proposal cancelled.", icon="🗑️")
                                st.rerun()
                                
        except Exception as e:
            st.error(f"Error loading sent proposals: {e}")


# -----------------------------------------------------------------------------
# 6. BUSINESS PROFILE MODULE
# -----------------------------------------------------------------------------
def render_business_profile(user_id):
    st.subheader("🏢 Business Profile & Brand Showcase")
    
    # Fetch user's current profile data
    try:
        prof_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        profile_data = prof_res.data[0] if prof_res.data else {}
    except Exception as e:
        st.error(f"Error loading profile data: {e}")
        profile_data = {}

    tab_view_prof, tab_edit_prof = st.tabs(["👁️ View Profile Showcase", "✏️ Edit Company Details"])

    # --- SUB-TAB 1: VIEW SHOWCASE ---
    with tab_view_prof:
        with st.container(border=True):
            col_logo, col_info = st.columns([1, 3])
            
            with col_logo:
                if profile_data.get("logo_url"):
                    st.image(profile_data["logo_url"], width=180)
                else:
                    st.info("📷 No logo uploaded yet")

            with col_info:
                st.markdown(f"## {profile_data.get('business_name', 'Business Name')}")
                st.caption(f"📍 **Location:** {profile_data.get('location', 'Not set')} | 📧 **Email:** {profile_data.get('contact_email', 'Not set')}")
                
                website = profile_data.get("website")
                if website:
                    clean_url = website if website.startswith("http") else f"https://{website}"
                    st.markdown(f"🌐 **Website:** [{website}]({clean_url})")

                st.markdown("### About Our Business")
                st.write(profile_data.get("bio") or "*No business description provided yet. Click 'Edit Company Details' to add a summary of your services.*")

        st.divider()
        st.markdown("### 📦 Active Barter Showcase")
        
        # Display user's own listings in showcase format
        posts_res = supabase.table("posts").select("*").eq("user_id", user_id).execute()
        user_posts = posts_res.data or []
        
        if not user_posts:
            st.info("You have no active listings published right now.")
        else:
            cols = st.columns(2)
            for idx, p in enumerate(user_posts):
                with cols[idx % 2]:
                    with st.container(border=True):
                        p_type = p.get("type") or p.get("post_type") or "Offer"
                        st.markdown(f"**{'🟢 OFFER' if p_type == 'Offer' else '🔵 NEED'}:** {p['title']}")
                        st.caption(f"🏷️ {p.get('category', 'General')}")
                        st.write(p.get("description", "")[:120] + "...")
                        if p.get("image_url"):
                            render_media(p["image_url"], width=200)

    # --- SUB-TAB 2: EDIT PROFILE ---
    with tab_edit_prof:
        with st.form("edit_profile_form"):
            st.markdown("### Edit Business Information")
            
            edit_biz_name = st.text_input("Business Name", value=profile_data.get("business_name") or "")
            edit_contact_email = st.text_input("Contact Email", value=profile_data.get("contact_email") or "")
            edit_location = st.text_input("Location", value=profile_data.get("location") or "Montreal, QC")
            edit_website = st.text_input("Website URL", value=profile_data.get("website") or "", placeholder="e.g. www.mycompany.com")
            edit_bio = st.text_area("Business Bio / Service Overview", value=profile_data.get("bio") or "", placeholder="Describe what your company does and what kinds of B2B barters you look for...")
            
            st.caption("🏢 **Upload Company Logo:**")
            uploaded_logo = st.file_uploader("Select Logo Image", type=["png", "jpg", "jpeg", "webp"])
            
            save_profile_btn = st.form_submit_button("Save Profile", type="primary")
            
            if save_profile_btn:
                try:
                    final_logo_url = profile_data.get("logo_url")
                    
                    if uploaded_logo:
                        with st.spinner("Uploading logo..."):
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
# 7. MAIN APPLICATION DASHBOARD
# -----------------------------------------------------------------------------
def main_app():
    user = st.session_state.user
    
    # Sidebar
    with st.sidebar:
        st.title("🤝 TradeIt B2B")
        st.write(f"Logged in as:\n**{user.email}**")
        st.divider()
        
        if st.button("Sign Out", type="secondary"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.rerun()

    # Navigation Tabs
    tab_feed, tab_create, tab_my_listings, tab_proposals, tab_profile = st.tabs([
        "🌐 Barter Feed", "➕ Create Post", "📋 My Listings", "📬 Trade Proposals", "🏢 Business Profile"
    ])

    # Pre-fetch user's active posts for proposal modals
    my_posts_res = supabase.table("posts").select("id, title, type, post_type").eq("user_id", user.id).execute()
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
                # Search & Filter Controls
                with st.container(border=True):
                    col_search, col_cat, col_type = st.columns([2, 1, 1])
                    
                    with col_search:
                        search_term = st.text_input(
                            "🔍 Search", 
                            placeholder="Search by title, description, or business...",
                            label_visibility="visible"
                        )
                    
                    with col_cat:
                        existing_cats = sorted(list(set(
                            [p.get("category").strip() for p in all_posts if p.get("category")]
                        )))
                        cat_options = ["All Categories"] + (existing_cats if existing_cats else ["Marketing", "Legal", "IT", "Design", "Consulting", "Finance"])
                        selected_category = st.selectbox("🏷️ Category", options=cat_options)
                    
                    with col_type:
                        selected_type = st.radio("📌 Type", options=["All", "Offers", "Needs"], horizontal=True)

                # Filtering logic
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
                    filtered_posts = [
                        p for p in filtered_posts
                        if (p.get("category") or "").lower() == selected_category.lower()
                    ]

                if selected_type == "Offers":
                    filtered_posts = [p for p in filtered_posts if (p.get("type") or p.get("post_type")) == "Offer"]
                elif selected_type == "Needs":
                    filtered_posts = [p for p in filtered_posts if (p.get("type") or p.get("post_type")) == "Need"]

                st.caption(f"Showing **{len(filtered_posts)}** of **{len(all_posts)}** total barter listings")
                
                if not filtered_posts:
                    st.warning("No listings match your search or filter criteria.")
                else:
                    for post in filtered_posts:
                        profile = post.get("profiles") or {}
                        biz_name = profile.get("business_name", "Business Member")
                        contact = profile.get("contact_email", user.email)
                        location = profile.get("location", "Montreal, QC")
                        logo = profile.get("logo_url")
                        website = profile.get("website")
                        bio = profile.get("bio")
                        
                        p_type = post.get("type") or post.get("post_type") or "Offer"
                        badge = "🟢 OFFER" if p_type == "Offer" else "🔵 NEED"
                        is_own_post = (post["user_id"] == user.id)
                        
                        with st.container(border=True):
                            col_header_left, col_header_right = st.columns([3, 1])
                            
                            with col_header_left:
                                st.markdown(f"### {badge}: {post['title']}")
                                st.caption(f"🏢 **{biz_name}** | 📍 {location} | 🏷️ **Category:** {post.get('category', 'General')}")
                            
                            with col_header_right:
                                if logo:
                                    st.image(logo, width=80)
                            
                            st.write(post.get("description", ""))
                            
                            if post.get("image_url"):
                                render_media(post["image_url"], width=350)
                                
                            st.divider()
                            col_mail, col_biz, col_prop = st.columns([1, 1, 1])
                            
                            with col_mail:
                                st.markdown(f"📧 [{contact}](mailto:{contact}?subject=TradeIt%20Barter%20Inquiry:%20{post['title']})")
                            
                            with col_biz:
                                with st.popover("🏢 Business Info"):
                                    if logo:
                                        st.image(logo, width=120)
                                    st.markdown(f"### {biz_name}")
                                    st.caption(f"📍 {location}")
                                    if website:
                                        clean_url = website if website.startswith("http") else f"https://{website}"
                                        st.markdown(f"🌐 [{website}]({clean_url})")
                                    if bio:
                                        st.write(bio)

                            with col_prop:
                                if is_own_post:
                                    st.caption("📌 *Your listing*")
                                else:
                                    with st.popover("🤝 Propose Trade", use_container_width=True):
                                        st.markdown(f"**Propose Swap for:** *{post['title']}*")
                                        
                                        if not my_active_posts:
                                            st.warning("Create an active listing under **'➕ Create Post'** before proposing a trade!")
                                        else:
                                            with st.form(key=f"prop_form_{post['id']}"):
                                                post_options = {
                                                    f"{p['title']} ({(p.get('type') or p.get('post_type') or 'Offer')})": p["id"] 
                                                    for p in my_active_posts
                                                }
                                                selected_label = st.selectbox("Select item to offer:", list(post_options.keys()))
                                                proposal_msg = st.text_area("Pitch note (optional):", placeholder="Hi! We would love to swap...")
                                                
                                                submit_prop = st.form_submit_button("Send Trade Proposal", type="primary")
                                                
                                                if submit_prop:
                                                    offered_id = post_options[selected_label]
                                                    try:
                                                        supabase.table("trade_proposals").insert({
                                                            "proposer_id": user.id,
                                                            "recipient_id": post["user_id"],
                                                            "target_post_id": post["id"],
                                                            "offered_post_id": offered_id,
                                                            "message": proposal_msg
                                                        }).execute()
                                                        
                                                        st.toast("Trade proposal sent!", icon="🚀")
                                                        st.rerun()
                                                    except Exception as prop_err:
                                                        st.error(f"Failed to send proposal: {prop_err}")

        except Exception as e:
            st.error(f"Error loading barter feed: {e}")

    # --- TAB 2: CREATE POST ---
    with tab_create:
        st.subheader("Post an Offer or Need")
        
        with st.form("create_post_form", clear_on_submit=True):
            post_type = st.selectbox("I want to...", ["Offer", "Need"])
            title = st.text_input("Title", placeholder="e.g., SEO & Digital Marketing in exchange for Legal Consulting")
            category = st.text_input("Category", placeholder="e.g., Marketing, Legal, IT, Design")
            description = st.text_area("Description", placeholder="Describe what you are offering or looking for in detail...")
            
            st.caption("📷 **Attach Image or Video (Optional):**")
            uploaded_file = st.file_uploader(
                "Upload Media File", 
                type=["png", "jpg", "jpeg", "webp", "mp4", "mov", "webm"],
                help="Upload an image or short video demonstrating your product or service."
            )
            image_url_input = st.text_input("Or paste an external Image/Video URL (optional)", placeholder="https://images.unsplash.com/photo-...")
            
            submit_post = st.form_submit_button("Publish Post", type="primary")
            
            if submit_post:
                if not title or not description:
                    st.error("Please provide both a title and description.")
                else:
                    try:
                        media_url = None
                        
                        if uploaded_file:
                            with st.spinner("Uploading media to Supabase Storage..."):
                                media_url = upload_file_to_supabase(uploaded_file, user.id, folder="media")
                        elif image_url_input:
                            media_url = image_url_input

                        supabase.table("posts").insert({
                            "user_id": user.id,
                            "title": title,
                            "type": post_type,
                            "post_type": post_type,
                            "category": category if category else "General",
                            "description": description,
                            "image_url": media_url
                        }).execute()
                        
                        st.toast("Post published to the Barter Board!", icon="🚀")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Failed to publish post: {e}")

    # --- TAB 3: MY LISTINGS ---
    with tab_my_listings:
        render_my_listings(user.id)

    # --- TAB 4: TRADE PROPOSALS ---
    with tab_proposals:
        render_trade_proposals(user.id)

    # --- TAB 5: BUSINESS PROFILE ---
    with tab_profile:
        render_business_profile(user.id)


# -----------------------------------------------------------------------------
# 8. ENTRY POINT
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