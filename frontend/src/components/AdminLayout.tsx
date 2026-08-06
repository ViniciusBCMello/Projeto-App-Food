import { Outlet } from 'react-router-dom';
import Sidebar from '../pages/admin/components/Sidebar';

const AdminLayout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
