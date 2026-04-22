import { Outlet } from 'react-router-dom';


import Header from './Header';
import Footer from './Footer';

const RootLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1" style={{ paddingBottom: '80px' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default RootLayout;