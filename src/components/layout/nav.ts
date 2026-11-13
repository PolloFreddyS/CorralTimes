import {
  Archive,
  BarChart3,
  Inbox,
  LayoutDashboard,
  Newspaper,
  PenLine,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  Icon: LucideIcon;
  end?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { to: '/redaccion', label: 'La Redacción', short: 'Redacción', Icon: LayoutDashboard, end: true },
  { to: '/redaccion/buzon', label: 'Buzón de Chismes', short: 'Buzón', Icon: Inbox },
  { to: '/redaccion/mesa', label: 'Mesa Editorial', short: 'Mesa', Icon: PenLine },
  { to: '/redaccion/imprenta', label: 'La Imprenta', short: 'Imprenta', Icon: Newspaper },
  { to: '/redaccion/caos', label: 'Depto. del Caos', short: 'Caos', Icon: Sparkles },
  { to: '/redaccion/power-rankings', label: 'Power Rankings', short: 'Ranking', Icon: Trophy },
  { to: '/redaccion/wall-street', label: 'Wall Street del Tilt', short: 'Bolsa LP', Icon: BarChart3 },
  { to: '/redaccion/archivo', label: 'Archivo del Gallinero', short: 'Archivo', Icon: Archive },
  { to: '/redaccion/seguridad', label: 'Centro de Seguridad', short: 'Seguridad', Icon: Shield },
];
