import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { FeatureDetailRoute } from './FeatureDetailRoute';
import { RootRoute } from './RootRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
    children: [
      {
        path: 'features/:featureId',
        element: <FeatureDetailRoute />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
