import type React from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { FrontPage } from '@/features/public/pages';
import { AdminGate } from './AdminGate';
import { AdminLoading, PublicLoading } from './AdminLoading';
import { NotFound } from './NotFound';

/**
 * Portada en el bundle principal (lo primero que abre quien llega desde WhatsApp).
 * Todo lo demás se carga de forma diferida; el código de HQ nunca se descarga en páginas públicas.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });
const pub = (name: 'EditionPage' | 'ArticlePage' | 'BolsaLpPage' | 'PowerRankingsPage' | 'JuegosPage' | 'PastoralArchivePage') =>
  page(() => import('@/features/public/pages').then((m) => ({ default: m[name] })));

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    HydrateFallback: PublicLoading,
    children: [
      { index: true, element: <FrontPage /> },
      { path: 'ediciones', lazy: page(() => import('@/features/public/pages').then((m) => ({ default: () => <m.EditionsPage /> }))) },
      { path: 'ediciones/:editionSlug', lazy: pub('EditionPage') },
      { path: 'ediciones/:editionSlug/:articleSlug', lazy: pub('ArticlePage') },
      { path: 'archivo', lazy: page(() => import('@/features/public/pages').then((m) => ({ default: () => <m.EditionsPage archive /> }))) },
      { path: 'bolsa-lp', lazy: pub('BolsaLpPage') },
      { path: 'power-rankings', lazy: pub('PowerRankingsPage') },
      { path: 'la-voz-del-pastor', lazy: pub('PastoralArchivePage') },
      { path: 'juegos', lazy: pub('JuegosPage') },
      { path: 'enviar-noticia', lazy: page(() => import('@/features/press-pass/PressPassPage').then((m) => ({ default: m.PressPassPage }))) },
      { path: 'press-pass', element: <Navigate to="/enviar-noticia" replace /> },
      { path: 'acceso', lazy: page(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))) },
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
          { path: 'mesa-pastoral', lazy: page(() => import('@/features/pastoral/MesaPastoralPage').then((m) => ({ default: m.MesaPastoralPage }))) },
          { path: 'imprenta', lazy: page(() => import('@/features/editions/EditionBuilderPage').then((m) => ({ default: m.EditionBuilderPage }))) },
          { path: 'creative-studio', lazy: page(() => import('@/features/creative/CreativeStudioPage').then((m) => ({ default: m.CreativeStudioPage }))) },
          { path: 'wall-street', lazy: page(() => import('@/features/lp-market/LpMarketPage').then((m) => ({ default: m.LpMarketPage }))) },
          { path: 'power-rankings', lazy: page(() => import('@/features/rankings/RankingsPage').then((m) => ({ default: m.RankingsPage }))) },
          { path: 'caos', lazy: page(() => import('@/features/caos/ChaosPage').then((m) => ({ default: m.ChaosPage }))) },
          { path: 'palabrero', lazy: page(() => import('@/features/palabrero/PalabreroAdminPage').then((m) => ({ default: m.PalabreroAdminPage }))) },
          { path: 'hemeroteca', lazy: page(() => import('@/features/archive/ArchivePage').then((m) => ({ default: m.ArchivePage }))) },
          { path: 'publicacion', lazy: page(() => import('@/features/publication/PublicationCenterPage').then((m) => ({ default: m.PublicationCenterPage }))) },
          { path: 'seguridad', lazy: page(() => import('@/features/security/SecurityPage').then((m) => ({ default: m.SecurityPage }))) },
          { path: 'archivo', element: <Navigate to="/redaccion/hemeroteca" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
];

export const createRouter = () => createBrowserRouter(routes);
