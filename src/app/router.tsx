import type React from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { PressPassPage } from '@/features/press-pass/PressPassPage';
import { AdminGate } from './AdminGate';
import { NotFound } from './NotFound';
import { AdminLoading } from './AdminLoading';

/**
 * Las pantallas de la redacción se cargan de forma diferida: el Press Pass público
 * no descarga código administrativo.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <PressPassPage /> },
      { path: 'press-pass', element: <PressPassPage /> },
      { path: 'acceso', element: <LoginPage /> },
    ],
  },
  {
    path: 'redaccion',
    element: <AdminGate />,
    HydrateFallback: AdminLoading,
    children: [
      {
        lazy: page(() => import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout }))),
        children: [
          { index: true, lazy: page(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))) },
          { path: 'buzon', lazy: page(() => import('@/features/submissions/InboxPage').then((m) => ({ default: m.InboxPage }))) },
          { path: 'mesa', lazy: page(() => import('@/features/stories/StoryDeskPage').then((m) => ({ default: m.StoryDeskPage }))) },
          { path: 'mesa/:submissionId', lazy: page(() => import('@/features/stories/StoryDeskPage').then((m) => ({ default: m.StoryDeskPage }))) },
          { path: 'imprenta', lazy: page(() => import('@/features/editions/EditionBuilderPage').then((m) => ({ default: m.EditionBuilderPage }))) },
          { path: 'caos', lazy: page(() => import('@/features/caos/ChaosPage').then((m) => ({ default: m.ChaosPage }))) },
          { path: 'power-rankings', lazy: page(() => import('@/features/rankings/RankingsPage').then((m) => ({ default: m.RankingsPage }))) },
          { path: 'wall-street', lazy: page(() => import('@/features/lp-market/LpMarketPage').then((m) => ({ default: m.LpMarketPage }))) },
          { path: 'archivo', lazy: page(() => import('@/features/archive/ArchivePage').then((m) => ({ default: m.ArchivePage }))) },
          { path: 'seguridad', lazy: page(() => import('@/features/security/SecurityPage').then((m) => ({ default: m.SecurityPage }))) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
];

export const createRouter = () => createBrowserRouter(routes);
