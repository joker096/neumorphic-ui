import {NavLink, useNavigate} from 'react-router-dom';
import { t } from '../lib/i18n'

const navItems = [
  {to: '/dashboard', icon: '▦', label: 'dashboard'},
  {to: '/users', icon: '👥', label: 'users'},
  {to: '/devices', icon: '📱', label: 'devices'},
  {to: '/ads', icon: '📢', label: 'ads'},
  {to: '/settings', icon: '⚙', label: 'settings'},
] as const;

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/');
  };

  return (
    <aside className="flex w-56 flex-col border-r border-gray-800 bg-[#0a0c0f]">
      <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
        <span className="text-lg">☠</span>
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            {t('layout.adminPanel')}
          </p>
          <p className="text-sm font-bold text-white">{t('layout.messenger')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({isActive}) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {t(`layout.${item.label}`)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-red-400"
        >
          <span>🚪</span>
          {t('layout.logout')}
        </button>
      </div>
    </aside>
  );
}
