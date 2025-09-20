import { Sidebar } from '~/components/layout/Sidebar';
import { MapView } from '~/features/map/components/MapView';

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar />
      </aside>
      <main className="app-shell__map" aria-label="Map viewport">
        <MapView />
      </main>
    </div>
  );
}
