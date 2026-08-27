import { Fence, Syringe, Tag, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Add one entry per feature as it lands — e.g. Reports (M7). Both the
// sidebar (desktop) and bottom tab bar (mobile) in AppShell render straight
// off this list, so nothing else needs touching.
export const navItems: NavItem[] = [
  { to: '/cows', label: 'Cows', icon: Tag },
  { to: '/yards', label: 'Yards', icon: Fence },
  { to: '/vaccines', label: 'Vaccines', icon: Syringe },
];
