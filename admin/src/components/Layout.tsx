import { ReactNode, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAdminI18n } from '../lib/i18n'
import { LayoutDashboard, Users, Monitor, Megaphone, Settings, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'layout.dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'layout.users', icon: Users },
  { path: '/devices', label: 'layout.devices', icon: Monitor },
  { path: '/ads', label: 'layout.ads', icon: Megaphone },
  { path: '/settings', label: 'layout.settings', icon: Settings },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const location = useLocation()
  const { t } = useAdminI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <aside className={`bg-[#1a1d24] border-r border-white/5 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className={`transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="text-sm font-bold">{t('layout.adminPanel')}</div>
            <div className="text-[10px] text-gray-500">{t('layout.messenger')}</div>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className={`transition-opacity whitespace-nowrap ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {t(item.label)}
              </span>
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-white/5">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`transition-opacity whitespace-nowrap ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              {t('layout.logout')}
            </span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
