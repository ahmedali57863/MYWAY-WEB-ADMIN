import type { ReactNode } from "react";

export type IconName =
  | "grid" | "users" | "check" | "student" | "chat" | "send" | "route"
  | "car" | "demand" | "match" | "bell" | "settings" | "search" | "chevron"
  | "arrow" | "more" | "shield" | "trend" | "clock" | "alert" | "logout"
  | "command" | "plus" | "download" | "close" | "menu";

const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  check: <><path d="m9 12 2 2 4-4"/><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/></>,
  student: <><path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6"/></>,
  chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  route: <><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M6 16V8a3 3 0 0 1 3-3h6M9 19h9a3 3 0 0 0 3-3v-3"/></>,
  car: <><path d="m5 17-2-2v-4l2-2 2-4h10l2 4 2 2v4l-2 2H5Z"/><path d="M7 9h10M7 17v2M17 17v2"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/></>,
  demand: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0M12 3V1M5 8H3M21 8h-2"/></>,
  match: <><path d="M16 3h5v5M8 3H3v5M21 16v5h-5M3 16v5h5"/><path d="m8 12 3 3 5-6"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.6v-.08A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-1.1-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.1a1.7 1.7 0 0 0 1-1.1V3h4v.08A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.9 9c.15.45.55.82 1.1 1v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  alert: <><path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  command: <><path d="M18 9a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 21h14"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export const navGroups = [
  { label: "WORKSPACE", items: [
    ["Overview", "grid", "overview"], ["Users", "users", "users"], ["Pending approvals", "check", "approvals"],
    ["Student verification", "student", "students"], ["Support inbox", "chat", "support"], ["Broadcast", "send", "broadcast"],
  ]},
  { label: "DATA COLLECTIONS", items: [
    ["Routes", "route", "routes"], ["Vehicles", "car", "vehicles"], ["Ride demand", "demand", "demand"],
    ["Matches", "match", "matches"], ["Notifications", "bell", "notifications"],
  ]},
] as const;

export const avatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop",
];

export const users = [
  { name: "Ayesha Malik", phone: "+92 300 1234567", city: "Islamabad", type: "Passenger", status: "Verified", date: "Today, 10:42 AM", avatar: avatars[0] },
  { name: "Hamza Iqbal", phone: "+92 321 7654321", city: "Rawalpindi", type: "Driver", status: "Pending", date: "Today, 9:18 AM", avatar: avatars[1] },
  { name: "Sara Ahmed", phone: "+92 333 9876543", city: "Lahore", type: "Passenger", status: "Verified", date: "Yesterday, 4:32 PM", avatar: avatars[2] },
  { name: "Usman Raza", phone: "+92 312 4567890", city: "Karachi", type: "Driver", status: "Unverified", date: "Yesterday, 2:07 PM", avatar: avatars[3] },
];

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "blue" | "amber" | "red" | "neutral" }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{children}</span>;
}

export function Button({ children, variant = "primary", onClick }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; onClick?: () => void }) {
  return <button className={`button button-${variant}`} onClick={onClick}>{children}</button>;
}

export function Header({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="page-header">
    <div><p className="eyebrow">MYWAY CONTROL CENTER</p><h1>{title}</h1><p>{description}</p></div>
    {actions && <div className="header-actions">{actions}</div>}
  </header>;
}

export function StatCard({ icon, label, value, delta, tone }: { icon: IconName; label: string; value: string; delta: string; tone: string }) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon name={icon}/></div>
    <div className="stat-top"><span>{label}</span><Badge tone="green">{delta}</Badge></div>
    <strong>{value}</strong>
    <small>vs. previous 30 days</small>
  </article>;
}

export function UserTable({ compact = false }: { compact?: boolean }) {
  return <div className="table-wrap"><table>
    <thead><tr><th>User</th><th>Phone number</th><th>City / region</th><th>Account type</th><th>Identity</th><th>Registered</th><th/></tr></thead>
    <tbody>{users.slice(0, compact ? 4 : users.length).map((user) => <tr key={user.name}>
      <td><div className="user-cell"><img src={user.avatar}/><span><b>{user.name}</b><small>{user.name.toLowerCase().replace(" ", ".")}@mail.com</small></span></div></td>
      <td>{user.phone}</td><td>{user.city}</td><td>{user.type}</td>
      <td><Badge tone={user.status === "Verified" ? "green" : user.status === "Pending" ? "amber" : "neutral"}>{user.status}</Badge></td>
      <td>{user.date}</td><td><button className="icon-button" aria-label={`More actions for ${user.name}`}><Icon name="more"/></button></td>
    </tr>)}</tbody>
  </table></div>;
}
