import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Home' },
  { to: '/drive', icon: '◎', label: 'Drive' },
  { to: '/map', icon: '⬡', label: 'Memory' },
  { to: '/analytics', icon: '▦', label: 'Trips' },
  { to: '/coach', icon: '✦', label: 'Coach' }
];

function MobileNav() {
  return (
    <nav className="flex border-t border-brand-border bg-brand-bg/95 backdrop-blur-sm pb-safe">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-body font-medium transition-all ${
              isActive 
                ? 'text-brand-cyan shadow-glow-cyan' 
                : 'text-brand-muted hover:text-brand-cyan'
            }`
          }
        >
          <span className="text-lg md:text-xl leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col h-full border-r border-brand-border bg-brand-bg transition-all ${
        isOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-brand-border">
          {isOpen && (
            <div>
              <div className="font-display text-lg font-bold text-brand-cyan">DriveMind</div>
              <div className="text-xs text-brand-muted">AI Driving Coach</div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-brand-surface rounded-lg transition-colors"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-2 px-3 py-6">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-brand-cyan text-brand-bg font-bold'
                    : 'text-brand-muted hover:bg-brand-surface hover:text-brand-cyan'
                }`
              }
            >
              <span className="text-xl">{icon}</span>
              {isOpen && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-brand-border px-3 py-6 flex flex-col gap-2">
          {isOpen && (
            <>
              <div className="px-2 py-2">
                <div className="text-sm font-semibold text-brand-text truncate">{user?.name}</div>
                <div className="text-xs text-brand-muted truncate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2 px-4 text-xs font-medium text-brand-red border border-brand-red rounded-lg hover:bg-red-950/30 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tablet/Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-cyan transition-colors"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-full w-full bg-brand-bg">
      {/* Desktop Sidebar */}
      {!isMobile && <SidebarNav />}

      {/* Main Content */}
      <div className="flex flex-col h-full flex-1">
        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileNav />}
      </div>
    </div>
  );
}
