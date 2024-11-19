import { ClickableProps } from './components/features'

export interface MenuModel {
  label: string
  to?: string
  href?: string
  children?: Omit<MenuModel, 'children'>[]
}

export interface MenuListModel {
  items: MenuModel[]
}
