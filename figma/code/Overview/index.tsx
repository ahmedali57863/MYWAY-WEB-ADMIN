import { Badge, Button, Header, Icon, StatCard, UserTable, type IconName } from "../shared/ui";
import "./styles.css";

export default function OverviewPage({ go }: { go: (page: string) => void }) {
  const bars = [42, 58, 46, 72, 63, 84, 67, 77, 57, 90, 78, 96, 70, 88];
  return <>
    <Header title="Good morning, Farhan" description="Here’s what’s happening across MYWAY today."
      actions={<><Button variant="secondary"><Icon name="download"/> Export report</Button><Button onClick={() => go("users")}><Icon name="plus"/> Add user</Button></>}/>
    <section className="stats-grid">
      <StatCard icon="users" label="Total users" value="12,842" delta="+12.5%" tone="lavender"/>
      <StatCard icon="route" label="Active routes" value="1,429" delta="+8.2%" tone="mint"/>
      <StatCard icon="match" label="Successful matches" value="4,871" delta="+18.7%" tone="peach"/>
      <StatCard icon="shield" label="Verified drivers" value="2,106" delta="+6.4%" tone="blue"/>
    </section>
    <section className="overview-grid">
      <article className="panel chart-panel">
        <div className="panel-heading"><div><h2>Ride activity</h2><p>Supply and demand over the last 14 days</p></div><select aria-label="Time range"><option>Last 14 days</option><option>Last 30 days</option></select></div>
        <div className="legend"><span><i className="legend-supply"/>Routes published</span><span><i className="legend-demand"/>Ride demand</span></div>
        <div className="chart">
          <div className="y-axis"><span>1.2k</span><span>800</span><span>400</span><span>0</span></div>
          <div className="bars">{bars.map((h, i) => <div className="bar-group" key={i}><i className="bar supply" style={{ height: `${h}%` }}/><i className="bar demand-bar" style={{ height: `${Math.max(20, h - 16 + (i % 3) * 8)}%` }}/></div>)}</div>
        </div>
        <div className="x-axis"><span>Jun 01</span><span>Jun 05</span><span>Jun 09</span><span>Jun 14</span></div>
      </article>
      <article className="panel pulse-panel">
        <div className="panel-heading"><div><h2>Live platform pulse</h2><p>Real-time operational health</p></div><Badge tone="green">Live</Badge></div>
        {[
          ["car", "Rides in progress", "138", "purple"], ["trend", "Match success rate", "84.6%", "green"],
          ["clock", "Avg. response time", "2m 14s", "orange"], ["alert", "Open incidents", "3", "red"],
        ].map(([icon, label, value, color]) => <div className="pulse-row" key={label}>
          <span className={`mini-icon ${color}`}><Icon name={icon as IconName}/></span><span>{label}<small>Updated just now</small></span><strong>{value}</strong>
        </div>)}
        <Button variant="secondary" onClick={() => go("approvals")}>View operations center <Icon name="arrow"/></Button>
      </article>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent registrations</h2><p>Newest members joining the MYWAY community</p></div><button className="text-button" onClick={() => go("users")}>View all users <Icon name="arrow"/></button></div>
      <UserTable compact/>
    </section>
  </>;
}
