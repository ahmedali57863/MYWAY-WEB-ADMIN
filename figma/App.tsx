import { useEffect, useMemo, useState } from "react";
import { Icon, navGroups } from "./code/shared/ui";
import OverviewPage from "./code/Overview";
import UsersPage from "./code/Users";
import PendingApprovalsPage from "./code/PendingApprovals";
import StudentVerificationsPage from "./code/StudentVerifications";
import SupportInboxPage from "./code/SupportInbox";
import BroadcastPage from "./code/Broadcast";
import RoutesPage from "./code/Routes";
import VehiclesPage from "./code/Vehicles";
import RideDemandPage from "./code/RideDemand";
import MatchesPage from "./code/Matches";
import NotificationsPage from "./code/Notifications";
import SettingsPage from "./code/Settings";

export default function App() {
  const [page, setPage] = useState("overview");
  const [sidebar, setSidebar] = useState(false);
  const [command, setCommand] = useState(false);
  const title = useMemo(() => navGroups.flatMap((group) => group.items).find((item) => item[2] === page)?.[0] || (page === "settings" ? "Settings" : "Overview"), [page]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (next: string) => {
    setPage(next);
    setSidebar(false);
    window.scrollTo(0, 0);
  };

  return <div className="app-shell">
    <aside className={`sidebar ${sidebar ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Icon name="route" size={22}/></span><span><b>MYWAY</b><small>ADMIN PORTAL</small></span><button className="mobile-close" onClick={() => setSidebar(false)}><Icon name="close"/></button></div>
      <nav>{navGroups.map((group) => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map(([label, icon, id]) => <button key={id} className={page === id ? "active" : ""} onClick={() => go(id)}><Icon name={icon}/><span>{label}</span>{id === "approvals" && <em>9</em>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className={page === "settings" ? "active" : ""} onClick={() => go("settings")}><Icon name="settings"/><span>Platform settings</span></button><div className="admin-card"><div className="avatar-initial">FA</div><span><b>Farhan Ali</b><small><i/> Super administrator</small></span><button aria-label="Log out"><Icon name="logout"/></button></div></div>
    </aside>
    {sidebar && <div className="sidebar-backdrop" onClick={() => setSidebar(false)}/>} 
    <main>
      <div className="topbar"><button className="menu-button" onClick={() => setSidebar(true)}><Icon name="menu"/></button><div className="crumb"><span>Admin</span><Icon name="chevron" size={14}/><b>{title}</b></div><button className="global-search" onClick={() => setCommand(true)}><Icon name="search"/><span>Search anything...</span><kbd><Icon name="command" size={12}/> K</kbd></button><button className="top-icon"><Icon name="bell"/><i/></button></div>
      <div className="page-content">
        {page === "overview" && <OverviewPage go={go}/>} 
        {page === "users" && <UsersPage/>}
        {page === "approvals" && <PendingApprovalsPage/>}
        {page === "students" && <StudentVerificationsPage/>}
        {page === "support" && <SupportInboxPage/>}
        {page === "broadcast" && <BroadcastPage/>}
        {page === "routes" && <RoutesPage/>}
        {page === "vehicles" && <VehiclesPage/>}
        {page === "demand" && <RideDemandPage/>}
        {page === "matches" && <MatchesPage/>}
        {page === "notifications" && <NotificationsPage/>}
        {page === "settings" && <SettingsPage/>}
      </div>
    </main>
    {command && <div className="modal-backdrop" onClick={() => setCommand(false)}><div className="command-modal" onClick={(event) => event.stopPropagation()}><label><Icon name="search"/><input autoFocus placeholder="Search users, routes, plates or IDs..."/><button onClick={() => setCommand(false)}>ESC</button></label><p>QUICK NAVIGATION</p>{[["users","Users","Find an account by name or phone"],["approvals","Pending approvals","9 submissions need review"],["vehicles","Vehicles","Search by plate or driver"],["support","Support inbox","12 open conversations"]].map(([id,label,description]) => <button key={id} onClick={() => { go(id); setCommand(false); }}><span className="record-icon"><Icon name={id === "users" ? "users" : id === "approvals" ? "check" : id === "vehicles" ? "car" : "chat"}/></span><span><b>{label}</b><small>{description}</small></span><Icon name="arrow"/></button>)}</div></div>}
  </div>;
}
