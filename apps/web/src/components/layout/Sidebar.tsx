import { ReactNode } from 'react';
import { Panel } from 'primereact/panel';

import { environment } from '~/config/environment';
import { FeatureListPanel } from '~/features/feature/components/FeatureListPanel';
import { DrawingToolbar } from '~/features/drawing/components/DrawingToolbar';

type SidebarProps = {
  children?: ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="sidebar" aria-label="Map editor controls">
      <header className="sidebar__header">
        <h1 className="sidebar__title">Map Editor</h1>
        <p className="sidebar__subtitle">
          Browse map features, inspect their details, and visualize them on the map.
        </p>
      </header>
      <DrawingToolbar />
      <FeatureListPanel />
      {children}
      <Panel header="API configuration" className="sidebar__panel">
        <p className="sidebar__text">
          Base URL:&nbsp;
          <code>{environment.apiBaseUrl}</code>
        </p>
      </Panel>
    </div>
  );
}
