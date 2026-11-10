import React from 'react';
import {
  Home,
  FileUp,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';

export type TabKey = 'home' | 'submit' | 'status' | 'admin' | 'dashboard';

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingCount: number;
  isAdminAuthenticated: boolean;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  isAdminAuthenticated,
  isSyncing = false,
  lastSyncTime = null,
  onRefresh,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { key: 'home' as TabKey, label: '1.หน้าหลัก', icon: Home },
    { key: 'submit' as TabKey, label: '2.ส่งงาน', icon: FileUp },
    {
      key: 'status' as TabKey,
      label: '3.ตรวจสอบสถานะ',
      icon: ClipboardList,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      key: 'admin' as TabKey,
      label: '4.ตรวจงาน',
      icon: ShieldCheck,
      isProtected: true,
    },
    {
      key: 'dashboard' as TabKey,
      label: '5.สรุปผล',
      icon: BarChart3,
    },
  ];

  const handleTabClick = (key: TabKey) => {
    onSelectTab(key);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Title */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img
                src="/assets/aistudio/Logo_ed04c8f2.png"
                alt="ตราสัญลักษณ์โรงเรียนบ้านค่าย"
                className="w-12 h-14 object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-800 tracking-tight leading-tight">
                  โรงเรียนบ้านค่าย
                </span>
                <span className="text-[11px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                  ภาคเรียนที่ 2/2569
                </span>
              </div>
              <p className="text-xs text-sky-700 font-medium">
                ระบบบันทึกกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleTabClick(item.key)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-500'}`} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span
                      className={`ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white text-sky-600'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.isProtected && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isAdminAuthenticated
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      title={isAdminAuthenticated ? 'Admin เข้าสู่ระบบแล้ว' : 'ต้องใส่รหัสผ่าน'}
                    >
                      {isAdminAuthenticated ? '✓ ปลดล็อค' : '🔒 ล็อค'}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Google Sheet Live Sync Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isSyncing}
                title={lastSyncTime ? `ดึงข้อมูลล่าสุดจาก Google Sheet (ซิงค์ล่าสุด: ${lastSyncTime} • ระบบ Auto-sync อัตโนมัติทุก 5 นาที)` : 'ดึงข้อมูลล่าสุดจาก Google Sheet (ระบบ Auto-sync อัตโนมัติทุก 5 นาที)'}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-60 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden xl:inline">{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ชีต'}</span>
                {lastSyncTime && !isSyncing && (
                  <span className="text-[10px] text-emerald-600 font-mono hidden 2xl:inline">({lastSyncTime})</span>
                )}
              </button>
            )}
          </nav>

          {/* Mobile Right Controls: Sync & Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isSyncing}
                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                title="ซิงค์ข้อมูลล่าสุดจาก Google Sheet"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-[11px]">{isSyncing ? 'ซิงค์...' : 'ซิงค์ชีต'}</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-sky-100 bg-white/95 px-4 pt-3 pb-6 shadow-xl space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-sky-600' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge} รอตรวจ
                    </span>
                  )}
                  {item.isProtected && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {isAdminAuthenticated ? 'Admin ปลดล็อคแล้ว' : '🔒 ต้องใส่รหัส'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
