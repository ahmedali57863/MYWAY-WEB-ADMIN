import { useState } from "react";
import { Button, Header, Icon, UserTable } from "../shared/ui";
import "./styles.css";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  return <>
    <Header title="Users" description="Manage accounts, verification status and platform privileges." actions={<Button><Icon name="plus"/> Add account</Button>}/>
    <section className="inline-stats">
      <div><span>Total accounts</span><strong>12,842</strong></div><div><span>Verified</span><strong>9,418</strong></div><div><span>Drivers</span><strong>2,106</strong></div><div><span>Students</span><strong>864</strong></div>
    </section>
    <section className="panel">
      <div className="toolbar"><label className="search-box"><Icon name="search"/><input placeholder="Search name, phone or user ID..." value={search} onChange={(e) => setSearch(e.target.value)}/></label><div className="filters"><button className="filter active">All users</button><button className="filter">Drivers</button><button className="filter">Passengers</button></div></div>
      <UserTable/>
    </section>
  </>;
}
