import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Messages.css";

import defaultProfile from "./assets/profile.png";

const API = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/CSE442/2025-Fall/cse-442ac/api";

/* Always return a valid avatar */
function resolveUrl(u) {
  if (!u) return defaultProfile;
  const file = u.split("/").pop();
  if (!file || !file.match(/\.(jpg|jpeg|png|gif)$/i)) return defaultProfile;
  return `${API}/uploads/${file}`;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const { cid } = useParams(); // NEW

  const me = Number(localStorage.getItem("userId"));

  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [text, setText] = useState("");
  const [peerProfile, setPeerProfile] = useState(null);

  const params = new URLSearchParams(location.search);
  const autoUser = Number(params.get("to") || 0); // keep ?to=ID working

  /* ---------------------------------------
     LOAD CONVERSATIONS
  ----------------------------------------*/
  async function loadConvos() {
    const r = await fetch(`${API}/messages_list_conversations.php?user_id=${me}`);
    const d = await r.json();
    if (d.ok) setConvos(d.conversations);
  }

  /* ---------------------------------------
     LOAD ALL MESSAGES IN CHAT
  ----------------------------------------*/
  async function loadMessages(cid) {
    if (!cid) return;

    const r = await fetch(
      `${API}/messages_get.php?conversation_id=${cid}&limit=200`
    );
    const d = await r.json();

    if (d.ok) {
      setMessages(d.messages);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 25);
    }
  }

  /* ---------------------------------------
     LOAD OTHER USER'S PROFILE
  ----------------------------------------*/
  async function loadPeerProfile(uid) {
    if (!uid) return;

    const r = await fetch(`${API}/profile_get.php?user_id=${uid}`);
    const d = await r.json();

    if (d.ok) {
      const clean = d.user.avatar_url
        ? d.user.avatar_url.split("/").pop()
        : null;

      setPeerProfile({
        ...d.user,
        avatar_url: clean,
      });
    }
  }

  /* ---------------------------------------
     CREATE / GET CONVERSATION
  ----------------------------------------*/
  async function startConversation(uid) {
    const r = await fetch(`${API}/messages_create_or_get.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: me, with_user_id: uid }),
    });

    const d = await r.json();
    if (!d.ok) return;

    const convoId = d.conversation_id;

    await loadConvos();
    setSelectedId(convoId);
    await loadMessages(convoId);
    await loadPeerProfile(uid);

    navigate(`/messages/${convoId}`, { replace: true });
  }

  /* ---------------------------------------
     INITIAL LOAD
  ----------------------------------------*/
  useEffect(() => {
    if (!me) {
      navigate("/login");
      return;
    }
    loadConvos();
  }, []);

  /* ---------------------------------------
     AUTO-START CHAT IF ?to=ID
  ----------------------------------------*/
  useEffect(() => {
    if (autoUser) {
      startConversation(autoUser);
    }
  }, [autoUser]);

  /* ---------------------------------------
     AUTO-OPEN CHAT WHEN USING /messages/:cid
  ----------------------------------------*/
  useEffect(() => {
    if (!cid) return;
    const numericCid = Number(cid);

    // Wait until convos are loaded
    if (!convos.length) return;

    const convo = convos.find((c) => c.conversation_id === numericCid);
    if (!convo) return;

    setSelectedId(numericCid);
    loadMessages(numericCid);
    loadPeerProfile(convo.other_user_id);
  }, [cid, convos]);

  /* ---------------------------------------
     ACTIVE CONVERSATION
  ----------------------------------------*/
  const activeConvo = useMemo(
    () => convos.find((c) => c.conversation_id === selectedId),
    [selectedId, convos]
  );

  const otherUserId = activeConvo?.other_user_id;

  /* ---------------------------------------
     LOAD PROFILE WHEN SELECTED CHANGES
  ----------------------------------------*/
  useEffect(() => {
    if (selectedId && otherUserId) {
      loadPeerProfile(otherUserId);
    }
  }, [selectedId, otherUserId]);

  /* ---------------------------------------
     SEND MESSAGE
  ----------------------------------------*/
  async function sendMessage() {
    if (!text.trim()) return;

    const r = await fetch(`${API}/messages_send.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: selectedId,
        sender_id: me,
        body: text,
      }),
    });

    const d = await r.json();

    if (d.ok) {
      setText("");
      loadMessages(selectedId);
      loadConvos();
    }
  }

  return (
    <div className="messages-container">
      {/* LEFT — Conversation List */}
      <div className="sidebar">
        <h2>Messages</h2>


        <div className="convo-list">
          {convos.map((c) => (
            <div
              key={c.conversation_id}
              onClick={() => {
                navigate(`/messages/${c.conversation_id}`);
              }}
              className={`convo-item ${
                selectedId === c.conversation_id ? "selected" : ""
              }`}
            >
              <img className="convo-avatar" src={resolveUrl(c.other_avatar)} />
              <div className="convo-texts">
                <div className="convo-name">{c.other_name}</div>
                <div className="convo-last">{c.last_message?.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER — Messages */}
      <div className="chat-panel">
        {!selectedId ? (
          <div className="blank-chat">Select a chat</div>
        ) : (
          <>
            <div className="messages-scroll" ref={scrollRef}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`msg ${m.sender_id === me ? "me" : "them"}`}
                >
                  <img
                    className="msg-avatar"
                    src={resolveUrl(m.sender_avatar_url)}
                  />
                  <div className="msg-bubble">{m.body}</div>
                </div>
              ))}
            </div>

            <div className="input-row">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Profile */}
      <div className="profile">
        {peerProfile ? (
          <>
            <img className="avatar-big" src={resolveUrl(peerProfile.avatar_url)} />
            <div className="profile-name">{peerProfile.display_name}</div>
            <div className="profile-bio">{peerProfile.bio || "No bio yet."}</div>

            <button
              className="view-profile-btn"
              onClick={() => navigate(`/profile/${peerProfile.id}`)}
            >
              View Full Profile
            </button>
          </>
        ) : (
          <>
            <img className="avatar-big" src={defaultProfile} />
            <div className="profile-name">Loading…</div>
          </>
        )}
      </div>
    </div>
  );
}
