import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../components/RootLayout';
import AdminLayout from '../components/AdminLayout';

import appRoutes from './app';
import adminRoutes from './admin';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: appRoutes,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: adminRoutes,
  },
]);

export default router;
