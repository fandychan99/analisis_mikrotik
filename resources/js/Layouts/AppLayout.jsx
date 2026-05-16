import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Router, Activity, BarChart3, Bell,
    ClipboardList, Settings, Menu, X, ChevronRight,
    Wifi, LogOut, User, NetworkIcon
} from 'lucide-react';

const navItems = [
    { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
    { href: '/devices',    label: 'Perangkat',       icon: Router },
    { href: '/traffic',    label: 'Monitor Traffic', icon: Activity },
    { href: '/reports',    label: 'Laporan',         icon: BarChart3 },
    { href: '/alerts',     label: 'Alert',           icon: Bell },
];

export default function AppLayout({ children, title = '' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url, props } = usePage();
    const user = props.auth?.user;

    const isActive = (href) => {
        if (href === '/dashboard') return url === '/dashboard';
        return url.startsWith(href);
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 z-40
                    flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm shadow-sky-200">
                        <NetworkIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-800 leading-tight">NetMonitor</div>
                        <div className="text-xs text-slate-400 font-medium">SNMP Analyzer</div>
                    </div>
                    <button
                        className="ml-auto lg:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
                    <div className="px-3 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Menu Utama
                        </span>
                    </div>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${active ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
                                <span>{item.label}</span>
                                {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
                            </Link>
                        );
                    })}

                    <div className="px-3 mt-5 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sistem
                        </span>
                    </div>

                    <Link
                        href="/profile"
                        className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Settings size={17} className={isActive('/profile') ? 'text-white' : 'text-slate-400'} />
                        <span>Profil</span>
                    </Link>
                </nav>

                {/* User info */}
                <div className="px-3 py-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-700 truncate">{user?.name ?? 'User'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{user?.email ?? ''}</div>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={14} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center gap-4">
                    {/* Hamburger */}
                    <button
                        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={18} />
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-blue-600"></div>
                        <h1 className="text-base font-bold text-slate-800">{title}</h1>
                    </div>

                    {/* Right side */}
                    <div className="ml-auto flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200">
                            <Wifi size={12} />
                            <span>SNMP Active</span>
                        </div>
                        <div className="text-xs text-slate-400 hidden sm:block">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
