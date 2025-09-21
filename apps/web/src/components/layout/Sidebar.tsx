import { Panel } from 'primereact/panel';

import { environment } from '~/config/environment';

export function Sidebar() {
  return (
    <div className="sidebar" aria-label="Map editor controls">
      <header className="sidebar__header">
        <h1 className="sidebar__title">Map Editor</h1>
        <p className="sidebar__subtitle">Draw, inspect, and edit map features.</p>
      </header>
      <Panel header="Getting started" toggleable>
        <p className="sidebar__text">
          Pan and zoom the map to explore the basemap. Drawing and editing tools will appear here in upcoming phases.
        </p>
      </Panel>
      <Panel header="API configuration" className="sidebar__panel">
        <p className="sidebar__text">
          Base URL:&nbsp;
          <code>{environment.apiBaseUrl}</code>
        </p>
      </Panel>
    </div>
  );
}
