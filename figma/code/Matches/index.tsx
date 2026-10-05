import { users, Badge, Button, Header, Icon, type IconName } from "../shared/ui";
import "./styles.css";

const collectionMeta: Record<string, { title: string; noun: string; count: string; icon: IconName }> = {
  routes: { title: "Routes", noun: "active route", count: "3,284", icon: "route" },
  vehicles: { title: "Vehicles", noun: "registered vehicle", count: "2,106", icon: "car" },
  demand: { title: "Ride demand", noun: "demand request", count: "1,892", icon: "demand" },
  matches: { title: "Matches", noun: "ride match", count: "4,871", icon: "match" },
  notifications: { title: "Notifications", noun: "notification", count: "28,490", icon: "bell" },
};

function CollectionContent({ page }: { page: string }) {
  const m = collectionMeta[page];
  return <>
    <Header title={m.title} description={`Inspect and manage every ${m.noun} in the MYWAY database.`} actions={<Button variant="secondary"><Icon name="download"/> Export CSV</Button>}/>
    <section className="inline-stats"><div><span>Total records</span><strong>{m.count}</strong></div><div><span>Active</span><strong>1,429</strong></div><div><span>Updated today</span><strong>286</strong></div><div><span>Needs review</span><strong>18</strong></div></section>
    <section className="panel">
      <div className="toolbar"><label className="search-box"><Icon name="search"/><input placeholder={`Search ${m.title.toLowerCase()}...`}/></label><div className="filters"><button className="filter active">All</button><button className="filter">Active</button><button className="filter">Archived</button></div></div>
      <div className="record-list">{[0,1,2,3,4].map((n) => <div className="record" key={n}>
        <span className="record-icon"><Icon name={m.icon}/></span>
        <span><b>{page === "vehicles" ? ["Honda Civic", "Toyota Corolla", "Suzuki Alto", "Honda City", "KIA Sportage"][n] : page === "notifications" ? ["Verification approved", "New ride match", "Route reminder", "Student status active", "Welcome to MYWAY"][n] : `${m.title.slice(0, -1)} · MW-${48291 + n * 37}`}</b><small>Created by {users[n % 4].name} · {n + 1}h ago</small></span>
        <span className="record-meta"><b>{page === "vehicles" ? ["ICT-482", "LEA-219", "RIM-662", "AHF-104", "BNU-884"][n] : users[n % 4].city}</b><small>{users[n % 4].phone}</small></span>
        <Badge tone={n === 3 ? "amber" : "green"}>{n === 3 ? "Pending" : "Active"}</Badge>
        <button className="icon-button"><Icon name="chevron"/></button>
      </div>)}</div>
    </section>
  </>;
}

export default function MatchesPage() {
  return <CollectionContent page="matches" />;
}
