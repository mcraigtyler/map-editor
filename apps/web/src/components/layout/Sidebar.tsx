import { ReactNode } from 'react';
import { FeatureListPanel } from '~/features/feature/components/FeatureListPanel';

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
      <FeatureListPanel />
      {children}
    </div>
  );
}
