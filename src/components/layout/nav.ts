import {
  Archive,
  BarChart3,
  BookOpen,
  Gamepad2,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Palette,
  PenLine,
  Rocket,
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

/** Navegación de HQ — orden de la especificación v2 (§11). */
export const ADMIN_NAV: NavItem[] = [
  { to: '/redaccion', label: 'La Redacción', short: 'Redacción', Icon: LayoutDashboard, end: true },
  { to: '/redaccion/buzon', label: 'Buzón de Chismes', short: 'Buzón', Icon: Inbox },
  { to: '/redaccion/mesa', label: 'Mesa Editorial', short: 'Mesa', Icon: PenLine },
  { to: '/redaccion/mesa-pastoral', label: 'Mesa Pastoral', short: 'Pastoral', Icon: BookOpen },
  { to: '/redaccion/imprenta', label: 'La Imprenta', short: 'Imprenta', Icon: Newspaper },
  { to: '/redaccion/creative-studio', label: 'Creative Studio', short: 'Studio', Icon: Palette },
  { to: '/redaccion/wall-street', label: 'Wall Street del Tilt', short: 'Bolsa LP', Icon: BarChart3 },
  { to: '/redaccion/power-rankings', label: 'Power Rankings', short: 'Ranking', Icon: Trophy },
  { to: '/redaccion/caos', label: 'Departamento del Caos', short: 'Caos', Icon: Sparkles },
  { to: '/redaccion/palabrero', label: 'El Palabrero', short: 'Palabrero', Icon: Gamepad2 },
  { to: '/redaccion/hemeroteca', label: 'Hemeroteca', short: 'Hemeroteca', Icon: Archive },
  { to: '/redaccion/publicacion', label: 'Centro de Publicación', short: 'Publicar', Icon: Rocket },
  { to: '/redaccion/seguridad', label: 'Centro de Seguridad', short: 'Seguridad', Icon: Shield },
];
