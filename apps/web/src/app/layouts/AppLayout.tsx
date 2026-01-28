import { Outlet } from 'react-router-dom';

import { Sidebar } from '~/components/layout/Sidebar';
import { DrawingToolbar } from '~/features/drawing/components/DrawingToolbar';
import { MapView } from '~/features/map/components/MapView';

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar>
          <Outlet />
        </Sidebar>
      </aside>
      <main className="app-shell__map" aria-label="Map viewport">
        <MapView />
        <div className="map-toolbar" aria-live="polite">
          <DrawingToolbar />
        </div>
      </main>
    </div>
  );
}
