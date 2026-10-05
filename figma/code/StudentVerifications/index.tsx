import { useState } from "react";
import { avatars, Button, Header, Icon } from "../shared/ui";
import "./styles.css";

const approvalData = [
  { name: "Hamza Iqbal", tier: "Tier 2", time: "14 minutes ago", cnic: "61101-2345678-9", city: "Islamabad", avatar: avatars[1] },
  { name: "Mehwish Khan", tier: "Tier 1", time: "42 minutes ago", cnic: "35202-9876543-1", city: "Lahore", avatar: avatars[2] },
  { name: "Bilal Ahmed", tier: "Tier 2", time: "2 hours ago", cnic: "42101-4567890-3", city: "Karachi", avatar: avatars[3] },
];

function ApprovalsContent({ student = false }: { student?: boolean }) {
  const [tab, setTab] = useState(student ? "Pending applications" : "Identity verifications");
  const [count, setCount] = useState(approvalData.length);
  return <>
    <Header title={student ? "Student verifications" : "Pending approvals"} description={student ? "Review student IDs and manage active education benefits." : "Review identity checks and driver applications in one place."}/>
    <div className="tabs">{(student ? ["Pending applications", "Active students"] : ["Identity verifications", "Driver applications"]).map((t) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}<span>{t.startsWith("Active") ? 864 : count}</span></button>)}</div>
    <section className="approval-list">
      {approvalData.slice(0, count).map((item) => <article className="approval-card" key={item.name}>
        <div className="approval-main"><img src={item.avatar}/><div><h3>{item.name}</h3><p>{student ? "National University of Sciences & Technology" : `${item.tier} identity verification`}</p><small>Submitted {item.time}</small></div></div>
        <div className="approval-detail"><span>{student ? "Student ID" : "CNIC NUMBER"}<b>{student ? "NUST-2024-1842" : item.cnic}</b></span><span>LOCATION<b>{item.city}</b></span><span>DOCUMENTS<b>3 files attached</b></span></div>
        <div className="approval-docs">
          <div><Icon name={student ? "student" : "users"}/><span>{student ? "Student card" : "Live selfie"}<small>Preview document</small></span></div>
          <div><Icon name="check"/><span>{student ? "Enrollment letter" : "CNIC · Front & back"}<small>Preview documents</small></span></div>
        </div>
        <div className="approval-actions"><Button variant="ghost">Reject</Button><Button onClick={() => setCount((n) => Math.max(0, n - 1))}><Icon name="check"/> Approve</Button></div>
      </article>)}
      {count === 0 && <div className="empty-state"><span><Icon name="check" size={28}/></span><h3>Queue cleared</h3><p>All applications have been reviewed.</p></div>}
    </section>
  </>;
}

export default function StudentVerificationsPage() {
  return <ApprovalsContent student />;
}
