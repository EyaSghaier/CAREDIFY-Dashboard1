import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Users, AlertTriangle,
  Settings, LogOut, Bell, Search, Menu, X, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { alerts, patients } from '../data/mockData';
import { CaredifyLogo, MessageNavIcon, MapNavIcon } from './CaredifyLogo';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', labelEn: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients',  label: 'Patients',         labelEn: 'Patients',         icon: Users },
  { path: '/alerts',    label: 'Alertes',           labelEn: 'Alerts',           icon: AlertTriangle },
  { path: '/messages',  label: 'Messages',          labelEn: 'Messages',          icon: null, customIcon: MessageNavIcon },
  { path: '/map',       label: 'Carte',             labelEn: 'Map',             icon: null, customIcon: MapNavIcon },
];

const bottomItems = [
  { path: '/settings', label: 'Paramètres', labelEn: 'Settings', icon: Settings },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  const isFullHeightPage = location.pathname === '/map' || location.pathname === '/messages';

  // Filter patients based on search
  const filteredPatients = search.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          p.condition.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowSearchDropdown(e.target.value.trim().length > 0);
  };

  // Handle Enter key press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      setShowSearchDropdown(false);
      navigate(`/patients?search=${encodeURIComponent(search)}`);
    }
  };

  // Navigate to patient detail
  const handlePatientClick = (patientId: string) => {
    setShowSearchDropdown(false);
    setSearch('');
    navigate(`/patients/${patientId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Compute initials from real user name
  const avatarInitials = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid var(--cd-bd)' }}
      >
        <CaredifyLogo size={36} textSize="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold"
          style={{ color: 'var(--cd-t5)' }}
        >
          {lang === 'FR' ? 'Navigation' : 'Navigation'}
        </p>
        {navItems.map(({ path, label, labelEn, icon: Icon, customIcon: CustomIcon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'text-[#0EA5E9]'
                  : 'hover:text-[var(--cd-t1)]'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive
                ? 'rgba(14,165,233,0.12)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(14,165,233,0.2)'
                : '1px solid transparent',
              color: isActive ? '#0EA5E9' : 'var(--cd-t4)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ backgroundColor: '#0EA5E9' }}
                  />
                )}
                {CustomIcon ? (
                  <CustomIcon className="w-4 h-4 flex-shrink-0" />
                ) : (
                  Icon && <Icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm font-medium flex-1">
                  {lang === 'EN' ? labelEn : label}
                </span>
                {path === '/alerts' && unreadAlerts > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#EF4444] text-white text-[10px] rounded-full font-bold animate-pulse">
                    {unreadAlerts}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4">
          <p
            className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold"
            style={{ color: 'var(--cd-t5)' }}
          >
            {lang === 'FR' ? 'Paramètres' : 'Settings'}
          </p>
          {bottomItems.map(({ path, label, labelEn, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? 'rgba(14,165,233,0.12)'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(14,165,233,0.2)'
                  : '1px solid transparent',
                color: isActive ? '#0EA5E9' : 'var(--cd-t4)',
              })}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {lang === 'EN' ? labelEn : label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--cd-bd)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--cd-bg1)' }}
        >
          {/* Avatar → Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] flex items-center justify-center flex-shrink-0 transition-all hover:ring-2 hover:ring-[#0EA5E9] hover:ring-offset-2 hover:ring-offset-[var(--cd-bg1)] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:ring-offset-[var(--cd-bg1)]"
            title={lang === 'FR' ? 'Paramètres du compte' : 'Account settings'}
          >
            <span className="text-white text-xs font-bold">{avatarInitials}</span>
          </button>

          {/* Name + specialty → Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 min-w-0 text-left transition-opacity hover:opacity-75 focus:outline-none"
            title={lang === 'FR' ? 'Paramètres du compte' : 'Account settings'}
          >
            <p className="text-sm font-medium truncate" style={{ color: 'var(--cd-t1)' }}>
              {user?.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--cd-t4)' }}>
              {user?.specialty ? `Cardiologue · ${user.specialty}` : 'Cardiologue'}
            </p>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="transition-colors hover:text-[#EF4444]"
            style={{ color: 'var(--cd-t4)' }}
            title={lang === 'FR' ? 'Déconnexion' : 'Logout'}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--cd-bg1)' }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{
          backgroundColor: 'var(--cd-bg2)',
          borderRight: '1px solid var(--cd-bd)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative flex flex-col w-64 z-10"
            style={{
              backgroundColor: 'var(--cd-bg2)',
              borderRight: '1px solid var(--cd-bd)',
            }}
          >
            <button
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--cd-t4)' }}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header
          className="flex items-center justify-between px-4 lg:px-6 py-3 flex-shrink-0"
          style={{
            backgroundColor: 'var(--cd-bg2)',
            borderBottom: '1px solid var(--cd-bd)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden transition-colors"
              style={{ color: 'var(--cd-t4)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div ref={searchRef} className="hidden sm:block relative w-64">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{
                  backgroundColor: 'var(--cd-bg3)',
                  border: '1px solid var(--cd-bd)',
                }}
              >
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--cd-t4)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={lang === 'FR' ? 'Rechercher un patient...' : 'Search a patient...'}
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: 'var(--cd-t3)', caretColor: '#0EA5E9' }}
                />
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && filteredPatients.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden shadow-lg z-50"
                  style={{
                    backgroundColor: 'var(--cd-bg2)',
                    border: '1px solid var(--cd-bd)',
                  }}
                >
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handlePatientClick(patient.id)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 transition-colors text-left"
                      style={{ color: 'var(--cd-t3)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--cd-hv)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{
                          background:
                            patient.riskClass === 'Critical'
                              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                              : patient.riskClass === 'At Risk'
                              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                              : 'linear-gradient(135deg, #10B981, #059669)',
                        }}
                      >
                        {patient.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--cd-t1)' }}>
                          {patient.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--cd-t4)' }}>
                          {patient.condition}
                        </p>
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            patient.riskClass === 'Critical'
                              ? 'rgba(239,68,68,0.15)'
                              : patient.riskClass === 'At Risk'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(16,185,129,0.15)',
                          color:
                            patient.riskClass === 'Critical'
                              ? '#EF4444'
                              : patient.riskClass === 'At Risk'
                              ? '#F59E0B'
                              : '#10B981',
                        }}
                      >
                        {patient.aiScore}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-[#10B981] text-xs font-medium">
                {lang === 'FR' ? 'En direct' : 'Live'}
              </span>
            </div>

            {/* Language switcher */}
            <div className="flex items-center gap-0.5 rounded-lg overflow-hidden" style={{ border: '1px solid var(--cd-bd)' }}>
              {(['FR', 'EN'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    background: lang === l ? '#0EA5E9' : 'transparent',
                    color: lang === l ? '#fff' : 'var(--cd-t4)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-lg transition-all"
              style={{
                color: 'var(--cd-t4)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--cd-hv)';
                e.currentTarget.style.color = 'var(--cd-t1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--cd-t4)';
              }}
              title={theme === 'dark' ? (lang === 'FR' ? 'Passer en mode clair' : 'Switch to light mode') : (lang === 'FR' ? 'Passer en mode sombre' : 'Switch to dark mode')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 rounded-lg transition-all"
              style={{ color: 'var(--cd-t4)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--cd-hv)';
                e.currentTarget.style.color = 'var(--cd-t1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--cd-t4)';
              }}
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
              )}
            </button>

            {/* User avatar → Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] flex items-center justify-center cursor-pointer transition-all focus:outline-none"
              style={{ boxShadow: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--cd-bg2), 0 0 0 4px #0EA5E9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--cd-bg2), 0 0 0 4px #0EA5E9'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              title={lang === 'FR' ? 'Paramètres du compte' : 'Account settings'}
            >
              <span className="text-white text-xs font-bold">{avatarInitials}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 ${isFullHeightPage ? 'overflow-hidden' : 'overflow-auto'}`}
          style={{ backgroundColor: 'var(--cd-bg1)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};