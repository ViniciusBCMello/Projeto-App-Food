import Home from '../pages/Home';
import Products from '../pages/Products';
import Login from '../pages/Login';
import Cart from '../pages/Cart';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';

const appRoutes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'produtos',
    element: <Products />
  },
  {
    path: 'login',
    element: <Login />
  },
  {
    path: 'carrinho',
    element: <Cart />
  },
  {
    path: 'meus-pedidos',
    element: <Orders />
  },
  {
    path: 'pedidos/:id',
    element: <OrderDetails />
  },
];

export default appRoutes;
