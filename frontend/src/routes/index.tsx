import { createBrowserRouter, Outlet } from 'react-router-dom';
import Home from '../pages/Home';
import Products from '../pages/Products';
import Login from '../pages/Login';
import Cart from '../pages/Cart';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';

import Header from '../components/Header';
import Footer from '../components/Footer';

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/produtos',
        element: <Products />
      },
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/carrinho',
        element: <Cart />
      },
      {
        path: '/meus-pedidos',
        element: <Orders />
      },
      {
        path: '/pedidos/:id',
        element: <OrderDetails />
      },
    ],
  },
]);

export default router;