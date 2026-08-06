import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import ProgressBar from '../components/ProgressBar';
import ComingSoon from '../pages/admin/components/ComingSoon';

const FinanceDashboard = lazy(() => import('../pages/admin/dashboards/Finance'));
const RevenueDashboard = lazy(() => import('../pages/admin/dashboards/Revenue'));
const ExpensesDashboard = lazy(() => import('../pages/admin/dashboards/Expenses'));
const MovementsDashboard = lazy(() => import('../pages/admin/dashboards/Movements'));
const FinancialSummaryDashboard = lazy(() => import('../pages/admin/dashboards/FinancialSummary'));

const OrdersDashboard = lazy(() => import('../pages/admin/dashboards/Orders'));
const ProductsDashboard = lazy(() => import('../pages/admin/dashboards/Products'));
const UsersDashboard = lazy(() => import('../pages/admin/dashboards/Users'));

const SettingsDashboard = lazy(() => import('../pages/admin/dashboards/Settings'));

const DashboardFallback = ProgressBar;

const adminRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <Suspense fallback={<DashboardFallback />}>
        <FinancialSummaryDashboard />
      </Suspense>
    )
  },
  {
    path: 'financeiro',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<DashboardFallback />}>
            <FinanceDashboard />
          </Suspense>
        )
      },
      {
        path: 'resumo',
        element: (
          <Suspense fallback={<DashboardFallback />}>
            <FinancialSummaryDashboard />
          </Suspense>
        )
      },
      {
        path: 'receitas',
        element: (
          <Suspense fallback={<DashboardFallback />}>
            <RevenueDashboard />
          </Suspense>
        )
      },
      {
        path: 'despesas',
        element: (
          <Suspense fallback={<DashboardFallback />}>
            <ExpensesDashboard />
          </Suspense>
        )
      },
      {
        path: 'movimentos',
        element: (
          <Suspense fallback={<DashboardFallback />}>
            <MovementsDashboard />
          </Suspense>
        )
      }
    ]
  },
  {
    path: 'pedidos',
    element: (
      <Suspense fallback={<DashboardFallback />}>
        <OrdersDashboard />
      </Suspense>
    )
  },
  {
    path: 'cardapio',
    element: (
      <Suspense fallback={<DashboardFallback />}>
        <ProductsDashboard />
      </Suspense>
    )
  },
  {
    path: 'clientes',
    element: (
      <Suspense fallback={<DashboardFallback />}>
        <UsersDashboard />
      </Suspense>
    )
  },
  {
    path: 'configuracoes',
    element: (
      <Suspense fallback={<DashboardFallback />}>
        <SettingsDashboard />
      </Suspense>
    )
  },
  {
    path: 'perfil',
    element: <ComingSoon feature="Meu Perfil" />
  }
];

export default adminRoutes;
