import { useState } from "react";
import { Button, Header, Icon, type IconName } from "../shared/ui";
import "./styles.css";

export default function SettingsPage() {
  const [section, setSection] = useState("Matching & rides");
  const sections: [string, IconName][] = [["Matching & rides","route"],["Fare & economy","trend"],["Verification rules","check"],["Notifications & gateways","bell"],["Security & access","shield"],["Feature flags","settings"],["Admin team","users"]];
  return <>
    <Header title="Platform settings" description="Configure MYWAY’s business rules, security and platform behavior." actions={<Button>Save changes</Button>}/>
    <div className="settings-layout"><aside className="settings-nav">{sections.map(([s, icon]) => <button className={section === s ? "active" : ""} key={s} onClick={() => setSection(s)}><Icon name={icon}/>{s}<Icon name="chevron"/></button>)}</aside>
      <section className="panel settings-panel"><div className="settings-title"><span className="stat-icon lavender"><Icon name={sections.find(([s]) => s === section)?.[1] || "settings"}/></span><div><h2>{section}</h2><p>Manage configuration for {section.toLowerCase()}.</p></div></div>
        {section === "Matching & rides" ? <>
          <SettingRange title="Matching proximity radius" description="Maximum pickup radius used for matching nearby routes." value="2.5 km" min="1 km" max="5 km"/>
          <SettingRange title="Route detour tolerance" description="Maximum additional time a driver can take for pickup." value="12 min" min="5 min" max="30 min"/>
          <div className="setting-row"><div><b>Maximum seats per carpool</b><p>Platform cap for passenger seats on a single route.</p></div><select><option>4 seats</option><option>3 seats</option><option>5 seats</option></select></div>
          <div className="setting-row"><div><b>Auto-cancellation grace period</b><p>Time before departure when cancellation is penalty-free.</p></div><select><option>30 minutes</option><option>1 hour</option><option>2 hours</option></select></div>
        </> : <>
          {["Enable this configuration module", "Require administrator approval", "Send staff alerts for changes"].map((label, i) => <div className="setting-row" key={label}><div><b>{label}</b><p>Apply this rule across the MYWAY platform.</p></div><label className="switch"><input type="checkbox" defaultChecked={i !== 1}/><span/></label></div>)}
          <div className="setting-row"><div><b>Default policy interval</b><p>Choose how often this configuration should be reviewed.</p></div><select><option>Every 6 months</option><option>Every 12 months</option></select></div>
        </>}
      </section>
    </div>
  </>;
}

function SettingRange({ title, description, value, min, max }: { title: string; description: string; value: string; min: string; max: string }) {
  return <div className="setting-range"><div><b>{title}</b><p>{description}</p></div><div className="range-value"><span>{min}</span><input type="range" min="0" max="100" defaultValue="48"/><span>{max}</span><strong>{value}</strong></div></div>;
}
