'use client'

import Link from 'next/link'
import { Grid2x2Plus } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  type NavItemType,
} from '@/components/ui/navigation-menu-21st'

const discoverItems: NavItemType[] = [
  {
    title: 'Marchés & Événements',
    href: '/events',
    description: '100+ marchés en France',
    icon: require('lucide-react').Calendar,
  },
  {
    title: 'Créateurs & Artisans',
    href: '/creators',
    description: '500+ créateurs connectés',
    icon: require('lucide-react').Users,
  },
]

const smallItems: NavItemType[] = [
  { title: 'Pop-ups', href: '#', description: 'Événements éphémères', icon: require('lucide-react').Zap },
  { title: 'Salons', href: '#', description: 'Salons professionnels', icon: require('lucide-react').Calendar },
  { title: 'Foires', href: '#', description: 'Foires artisanales', icon: require('lucide-react').BarChart3 },
]

const listItems: NavItemType[] = [
  { title: 'Carte interactive', href: '#', icon: require('lucide-react').MapPin },
  { title: 'Candidatures', href: '#', icon: require('lucide-react').Users },
  { title: 'Messagerie', href: '#', icon: require('lucide-react').MessageSquare },
  { title: 'Aide', href: '#', icon: require('lucide-react').HelpCircle },
]

export function Navbar21st() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Grid2x2Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">Nexart</span>
        </Link>

        {/* Menu Central */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Découvrir</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-full gap-6 p-6 md:w-[600px] lg:w-[900px] grid-cols-3">
                    {/* Colonne 1 */}
                    <div className="flex flex-col gap-4">
                      {discoverItems.map((item) => (
                        <NavGridCard key={item.href} link={item} />
                      ))}
                    </div>

                    {/* Colonne 2 */}
                    <div className="flex flex-col gap-3">
                      {smallItems.map((item) => (
                        <NavSmallItem key={item.href} item={item} href={item.href} />
                      ))}
                    </div>

                    {/* Colonne 3 */}
                    <div className="flex flex-col gap-2">
                      {listItems.map((item) => (
                        <NavLargeItem key={item.href} link={item} href={item.href} />
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Créateurs</NavigationMenuTrigger>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="#" className="px-4 py-1 text-sm font-medium text-slate-900 hover:text-violet-600 transition-colors">
                  Tarifs
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Bouton S'inscrire */}
        <Link
          href="/register"
          className="px-6 py-2 rounded-full border-2 border-slate-900 text-slate-900 font-semibold hover:bg-slate-900 hover:text-white transition-all"
        >
          S'inscrire
        </Link>
      </nav>
    </header>
  )
}
