import { useState } from "react";
import { avatars, users, Badge, Button, Header, Icon } from "../shared/ui";
import "./styles.css";

export default function SupportInboxPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  return <>
    <Header title="Support inbox" description="Respond to customer issues and track active conversations."/>
    <section className="support-shell">
      <aside className="threads"><div className="thread-head"><h2>Conversations</h2><Badge tone="blue">12 open</Badge></div><label className="search-box"><Icon name="search"/><input placeholder="Search conversations..."/></label>
        {users.map((user, i) => <button className={`thread ${i === 0 ? "active" : ""}`} key={user.name}><img src={user.avatar}/><span><b>{user.name}</b><small>{i === 0 ? "My account is still pending..." : "Thanks for your help!"}</small></span><time>{i * 8 + 2}m</time></button>)}
      </aside>
      <div className="conversation">
        <div className="conversation-head"><div className="user-cell"><img src={avatars[0]}/><span><b>Ayesha Malik</b><small><i/> Online now</small></span></div><button className="icon-button"><Icon name="more"/></button></div>
        <div className="messages">
          <div className="message inbound">Hi, my identity verification has been pending for two days. Could you please check it?<time>10:24 AM</time></div>
          <div className="message outbound">Hi Ayesha, I’m looking into your submission now. Your documents are clear; it should be approved shortly.<time>10:27 AM</time></div>
          <div className="message inbound">Thank you so much!<time>10:28 AM</time></div>
          {sent.map((m, i) => <div className="message outbound" key={i}>{m}<time>Just now</time></div>)}
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); if (message.trim()) { setSent([...sent, message]); setMessage(""); } }}>
          <textarea placeholder="Write a response..." value={message} onChange={(e) => setMessage(e.target.value)}/><Button><Icon name="send"/> Send response</Button>
        </form>
      </div>
    </section>
  </>;
}
