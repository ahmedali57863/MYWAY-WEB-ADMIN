import { useState } from "react";
import { Button, Header, Icon } from "../shared/ui";
import "./styles.css";

export default function BroadcastPage() {
  const [sent, setSent] = useState(false);
  return <>
    <Header title="Broadcast notification" description="Send a push notification to the MYWAY community."/>
    <div className="broadcast-grid"><section className="panel form-panel"><div className="field"><label>Notification heading</label><input placeholder="e.g. System maintenance tonight"/></div><div className="field"><label>Message body</label><textarea placeholder="Write a clear and concise notification..." rows={6}/></div><div className="form-row"><div className="field"><label>Audience</label><select><option>All registered users</option><option>Drivers only</option><option>Students only</option></select></div><div className="field"><label>Delivery</label><select><option>Send immediately</option><option>Schedule for later</option></select></div></div><Button onClick={() => setSent(true)}><Icon name="send"/> Send broadcast</Button></section>
      <aside className="panel preview-card"><p>LIVE PREVIEW</p><div className="phone-preview"><span className="app-mark">M</span><div><b>MYWAY</b><strong>{sent ? "Notification sent successfully" : "Your notification heading"}</strong><p>{sent ? "Delivered to 11,948 active devices." : "Your message will appear here as you compose it."}</p><small>now</small></div></div><div className="delivery-note"><Icon name="shield"/><span><b>Safe delivery</b><p>Inactive and opted-out devices are automatically excluded.</p></span></div></aside>
    </div>
  </>;
}
