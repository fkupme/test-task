export interface SubMenuItem {
  title: string;
  link?: string;
  counter?: number;
  hasAccess?: boolean;
  ym?: string;
  add?: boolean;
  submenu?: SubMenuItem[];
}

export interface SidebarMenuItem {
  title: string;
  icon: string;
  link?: string;
  subMenu?: SubMenuItem[];
  counter?: number;
  action?: () => void;
}

export interface SidebarState {
  items: SidebarMenuItem[];
  rail: boolean;
  drawer: boolean;
}

export type MenuPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
