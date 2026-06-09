import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useMemo } from 'react';
import {
    Shield, ShieldAlert, ShieldCheck, ShieldX,
    LogIn, LogOut, AlertTriangle, Globe, Monitor,
    Lock, Unlock, Activity, RefreshCw, Clock, User,
    Server, Trash2, CheckCircle, Eye, Filter
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ── FCAPS Badge Strip ──
function FcapsBadge() {
    const dims = [
        { letter: 'F', label: 'Fault',         bg: 'bg-red-50',    text: 'text-red-400',   border: 'border-red-100' },
        { letter: 'C', label: 'Configuration', bg: 'bg-amber-50',  text: 'text-amber-400', border: 'border-amber-100' },
        { letter: 'A', label: 'Accounting',    bg: 'bg-emerald-50',text: 'text-emerald-400',border: 'border-emerald-100' },
        { letter: 'P', label: 'Performance',   bg: 'bg-blue-50',   text: 'text-blue-400',  border: 'border-blue-100' },
        { letter: 'S', label: 'Security',      active: true },
    ];
    return (
        <div className="flex gap-2 flex-wrap mb-5">
            {dims.map(d => d.active ? (
                <div key={d.letter} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-sm shadow-violet-200">
                    <span className="text-base font-black text-white">{d.letter}</span>
                    <span className="text-xs font-semibold text-violet-100">{d.label}</span>
                    <span className="ml-1 text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">AKTIF</span>
                </div>
            ) : (
                <div key={d.letter} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${d.bg} border ${d.border}`}>
                    <span className={`text-sm font-black ${d.text}`}>{d.letter}</span>
                    <span className={`text-xs ${d.text} hidden sm:block`}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Security Score Ring ──
function SecurityScoreRing({ score }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Aman' : score >= 60 ? 'Waspada' : 'Bahaya';
    const deg = (score / 100) * 360;
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <div
                    className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{
                        background: `conic-gradient(${color} ${deg}deg, #e2e8f0 ${deg}deg)`,
                    }}
                >
                    <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                        <span className="text-2xl font-black" style={{ color }}>{score}</span>
                        <span className="text-[10px] font-bold text-slate-400 -mt-0.5">/ 100</span>
                    </div>
                </div>
            </div>
            <span className="mt-2 text-sm font-bold" style={{ color }}>{label}</span>
            <span className="text-xs text-slate-400">Security Score</span>
        </div>
    );
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color = 'sky', sub }) {
    const colors = {
        sky:     { bg: 'bg-sky-500',     light: 'bg-sky-50',   text: 'text-sky-700' },
        emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
        red:     { bg: 'bg-red-500',     light: 'bg-red-50',   text: 'text-red-700' },
        amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50', text: 'text-amber-700' },
        violet:  { bg: 'bg-violet-500',  light: 'bg-violet-50',text: 'text-violet-700' },
    };
    const c = colors[color] ?? colors.sky;
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className={`text-2xl font-black ${c.text}`}>{value}</div>
                {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

// ── Severity Badge ──
function SevBadge({ severity }) {
    if (severity === 'danger')  return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">🔴 Kritis</span>;
    if (severity === 'warning') return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">🟡 Peringatan</span>;
    return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">🟢 Info</span>;
}

const PERIOD_LABELS = { '1h': '1 Jam', '6h': '6 Jam', '24h': '24 Jam', '7d': '7 Hari', '30d': '30 Hari' };

export default function SecurityIndex({
    login_stats, suspicious_ips, login_history,
    activities, security_score, hourly_data,
    period, action_filter
}) {
    const [tab, setTab] = useState('overview');
    const [actFilter, setActFilter] = useState(action_filter ?? '');

    const handlePeriodChange = (p) => {
        router.get('/security', { period: p }, { preserveState: true, replace: true });
    };

    const handleActFilter = (e) => {
        e.preventDefault();
        router.get('/security', { period, action: actFilter }, { preserveState: true, replace: true });
    };

    const successRate = login_stats.total > 0
        ? Math.round((login_stats.success / login_stats.total) * 100)
        : 100;

    return (
        <AppLayout title="Keamanan Sistem">
            <Head title="Keamanan — Security FCAPS" />

            {/* FCAPS Badge */}
            <FcapsBadge />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield size={20} className="text-violet-600" />
                        Security Management
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Dimensi S — FCAPS · Audit log, login history, analisis ancaman
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Period selector */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        {Object.entries(PERIOD_LABELS).map(([p, label]) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    period === p
                                        ? 'bg-white text-violet-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => router.reload()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Overview Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                <StatCard icon={Activity}    label="Total Aktivitas Login" value={login_stats.total}      color="sky"     />
                <StatCard icon={ShieldCheck} label="Login Berhasil"        value={login_stats.success}    color="emerald" sub={`${successRate}% success rate`} />
                <StatCard icon={ShieldX}     label="Login Gagal"           value={login_stats.failed}     color="red"     />
                <StatCard icon={Globe}       label="IP Unik"               value={login_stats.unique_ips} color="amber"   />
                <StatCard icon={Lock}        label="IP Diblokir"           value={login_stats.blocked_ips}color="violet"  sub="≥10 gagal / 15 menit" />
            </div>

            {/* ── Security Score + Hourly Chart ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
                {/* Score */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
                    <SecurityScoreRing score={security_score} />
                    <div className="w-full border-t border-slate-50 pt-3 space-y-1.5 text-xs text-slate-500">
                        <div className="flex justify-between">
                            <span>Login Gagal</span>
                            <span className="font-semibold text-slate-700">-{Math.min(30, login_stats.failed * 2)} poin</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IP Diblokir</span>
                            <span className="font-semibold text-slate-700">-{Math.min(20, login_stats.blocked_ips * 10)} poin</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IP Unik Mencoba</span>
                            <span className="font-semibold text-slate-700">
                                -{Math.min(15, Math.max(0, login_stats.unique_ips - 5) * 3)} poin
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hourly Chart */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm">Login per Jam (24 Jam Terakhir)</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Berhasil vs Gagal</p>
                        </div>
                        <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Berhasil</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Gagal</span>
                        </div>
                    </div>
                    {hourly_data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={hourly_data} barSize={8} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={3} />
                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="success" name="Berhasil" fill="#34d399" radius={[3,3,0,0]} />
                                <Bar dataKey="failed"  name="Gagal"    fill="#f87171" radius={[3,3,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-slate-300">
                            <p className="text-sm">Pilih periode 24 Jam untuk melihat grafik per jam</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
                {[
                    { key: 'overview', label: '🔍 Ringkasan', },
                    { key: 'logins',   label: '🔐 Login History', },
                    { key: 'threats',  label: '🚨 Ancaman', },
                    { key: 'audit',    label: '📋 Audit Trail', },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            tab === t.key
                                ? 'bg-white text-violet-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Ringkasan ── */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Fitur keamanan aktif */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Fitur Keamanan Aktif</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { icon: '✅', label: 'Autentikasi Login', desc: 'Email + Password (bcrypt hashing)', ok: true },
                                { icon: '✅', label: 'CSRF Protection', desc: 'Laravel CSRF Token — semua form', ok: true },
                                { icon: '✅', label: 'Route Protection', desc: 'middleware([auth, verified]) — semua halaman', ok: true },
                                { icon: '✅', label: 'Login Audit Log', desc: 'Rekam setiap percobaan login + IP + browser', ok: true },
                                { icon: '✅', label: 'Activity Log (Audit Trail)', desc: 'Track aksi: tambah device, resolve alert, hapus', ok: true },
                                { icon: '✅', label: 'IP Rate Limiting', desc: 'Blokir IP setelah ≥10 gagal dalam 15 menit', ok: true },
                                { icon: '✅', label: 'HTTP Security Headers', desc: 'X-Frame-Options, CSP, X-Content-Type-Options', ok: true },
                                { icon: '✅', label: 'Session Regeneration', desc: 'Session ID diperbarui setiap login', ok: true },
                                { icon: '⚠️', label: 'Two-Factor Auth (2FA)', desc: 'Belum diimplementasikan', ok: false },
                                { icon: '⚠️', label: 'RBAC (Role-Based Access)', desc: 'Belum diimplementasikan', ok: false },
                            ].map((f, i) => (
                                <div key={i} className="px-5 py-3 flex items-center gap-3">
                                    <span className="text-base">{f.icon}</span>
                                    <div className="flex-1">
                                        <div className={`text-sm font-semibold ${f.ok ? 'text-slate-700' : 'text-slate-400'}`}>{f.label}</div>
                                        <div className="text-xs text-slate-400">{f.desc}</div>
                                    </div>
                                    {f.ok
                                        ? <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                                        : <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suspicious IPs */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-red-500" />
                            <h3 className="font-bold text-slate-700 text-sm">IP Mencurigakan ({suspicious_ips.length})</h3>
                        </div>
                        {suspicious_ips.length === 0 ? (
                            <div className="py-12 text-center">
                                <ShieldCheck size={32} className="mx-auto text-emerald-200 mb-2" />
                                <p className="text-sm text-slate-400">Tidak ada IP mencurigakan dalam periode ini</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full data-table">
                                    <thead>
                                        <tr>
                                            <th>IP Address</th>
                                            <th className="text-center">Percobaan</th>
                                            <th>Terakhir</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suspicious_ips.map((ip, i) => (
                                            <tr key={i} className={ip.is_blocked ? 'bg-red-50/40' : ''}>
                                                <td className="font-mono text-sm text-slate-700 font-semibold">{ip.ip}</td>
                                                <td className="text-center">
                                                    <span className={`text-sm font-black ${ip.is_blocked ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {ip.attempts}×
                                                    </span>
                                                </td>
                                                <td className="text-xs text-slate-400">{ip.last_attempt}</td>
                                                <td>
                                                    {ip.is_blocked
                                                        ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">🚫 Diblokir</span>
                                                        : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">⚠️ Waspada</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Login History ── */}
            {tab === 'logins' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LogIn size={16} className="text-sky-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Login History</h3>
                        </div>
                        <span className="text-xs text-slate-400">{login_history.length} record</span>
                    </div>
                    {login_history.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <LogIn size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm">Belum ada log login dalam periode ini</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>IP Address</th>
                                        <th>Browser</th>
                                        <th>Platform</th>
                                        <th>Status</th>
                                        <th>Keterangan</th>
                                        <th>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {login_history.map(l => (
                                        <tr key={l.id} className={l.status === 'failed' ? 'bg-red-50/20' : ''}>
                                            <td className="font-medium text-slate-700">{l.email}</td>
                                            <td className="font-mono text-sm text-slate-600">{l.ip_address}</td>
                                            <td className="text-slate-500 text-sm">{l.browser ?? '—'}</td>
                                            <td className="text-slate-500 text-sm">{l.platform ?? '—'}</td>
                                            <td>
                                                {l.status === 'success'
                                                    ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">✅ Berhasil</span>
                                                    : <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold">❌ Gagal</span>
                                                }
                                            </td>
                                            <td className="text-xs text-slate-400">{l.failure_reason ?? '—'}</td>
                                            <td className="text-xs text-slate-400" title={l.logged_at_full}>{l.logged_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Ancaman ── */}
            {tab === 'threats' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-red-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Analisis Ancaman</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                {
                                    title: 'Brute Force Detection',
                                    desc: `${login_stats.failed} percobaan login gagal dalam periode ${PERIOD_LABELS[period]}`,
                                    level: login_stats.failed > 10 ? 'danger' : login_stats.failed > 3 ? 'warning' : 'ok',
                                    icon: Lock,
                                },
                                {
                                    title: 'Multiple Source IPs',
                                    desc: `${login_stats.unique_ips} IP unik mencoba akses dalam periode ini`,
                                    level: login_stats.unique_ips > 10 ? 'danger' : login_stats.unique_ips > 3 ? 'warning' : 'ok',
                                    icon: Globe,
                                },
                                {
                                    title: 'IP Blocking Active',
                                    desc: login_stats.blocked_ips > 0
                                        ? `${login_stats.blocked_ips} IP sedang diblokir (≥10 gagal / 15 menit)`
                                        : 'Tidak ada IP yang diblokir saat ini',
                                    level: login_stats.blocked_ips > 0 ? 'warning' : 'ok',
                                    icon: ShieldX,
                                },
                                {
                                    title: 'Success Rate',
                                    desc: `${successRate}% login berhasil dari ${login_stats.total} total percobaan`,
                                    level: successRate < 50 ? 'danger' : successRate < 80 ? 'warning' : 'ok',
                                    icon: Activity,
                                },
                            ].map((t, i) => {
                                const Icon = t.icon;
                                const colors = {
                                    danger:  { bg: 'bg-red-50',     border: 'border-red-200',    icon: 'bg-red-500',     text: 'text-red-700',     badge: '🔴 Kritis' },
                                    warning: { bg: 'bg-amber-50',   border: 'border-amber-200',  icon: 'bg-amber-500',   text: 'text-amber-700',   badge: '🟡 Waspada' },
                                    ok:      { bg: 'bg-emerald-50', border: 'border-emerald-200',icon: 'bg-emerald-500', text: 'text-emerald-700', badge: '🟢 Aman' },
                                };
                                const c = colors[t.level];
                                return (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${c.bg} ${c.border}`}>
                                        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={18} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold text-sm ${c.text}`}>{t.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white/70 ${c.text}`}>{c.badge}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Suspicious IPs detail */}
                    {suspicious_ips.length > 0 && (
                        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2 bg-red-50/50">
                                <ShieldX size={16} className="text-red-600" />
                                <h3 className="font-bold text-red-700 text-sm">IP Mencurigakan — Detail</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full data-table">
                                    <thead>
                                        <tr>
                                            <th>IP Address</th>
                                            <th className="text-center">Percobaan Gagal</th>
                                            <th>Terakhir Aktif</th>
                                            <th>Status</th>
                                            <th>Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suspicious_ips.map((ip, i) => (
                                            <tr key={i} className={ip.is_blocked ? 'bg-red-50/40' : 'bg-amber-50/30'}>
                                                <td className="font-mono text-slate-800 font-bold">{ip.ip}</td>
                                                <td className="text-center">
                                                    <div className={`inline-flex items-center gap-1 text-sm font-black px-2 py-0.5 rounded-full ${ip.is_blocked ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {ip.attempts}×
                                                    </div>
                                                </td>
                                                <td className="text-sm text-slate-500">{ip.last_attempt}</td>
                                                <td>
                                                    {ip.is_blocked
                                                        ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">🚫 AUTO BLOKIR</span>
                                                        : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">⚠️ Monitoring</span>
                                                    }
                                                </td>
                                                <td className="text-xs text-slate-400">
                                                    {ip.is_blocked ? 'Diblokir 15 menit' : 'Pantau terus'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Audit Trail ── */}
            {tab === 'audit' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-violet-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Audit Trail Aktivitas</h3>
                        </div>
                        <form onSubmit={handleActFilter} className="flex gap-2">
                            <select
                                value={actFilter}
                                onChange={e => setActFilter(e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Semua Aksi</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                                <option value="login.failed">Login Gagal</option>
                                <option value="device.create">Tambah Perangkat</option>
                                <option value="device.update">Ubah Perangkat</option>
                                <option value="device.delete">Hapus Perangkat</option>
                                <option value="device.poll">Poll Manual</option>
                                <option value="alert.resolve">Resolve Alert</option>
                                <option value="alert_rule.create">Tambah Rule</option>
                                <option value="alert_rule.delete">Hapus Rule</option>
                            </select>
                            <button type="submit" className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg font-semibold hover:bg-violet-700 transition-colors">
                                Filter
                            </button>
                        </form>
                    </div>

                    {activities.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <Eye size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm">Belum ada aktivitas terekam dalam periode ini</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {activities.map(a => (
                                <div key={a.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="mt-0.5 text-base">{a.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-800 text-sm">{a.user_name}</span>
                                            <span className="text-slate-400 text-xs">—</span>
                                            <span className="text-sm text-slate-600">{a.action_label}</span>
                                            {a.subject_label && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                                                    {a.subject_label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-400">{a.performed_at}</span>
                                            {a.ip_address && (
                                                <span className="text-xs text-slate-400 font-mono">📍 {a.ip_address}</span>
                                            )}
                                        </div>
                                    </div>
                                    <SevBadge severity={a.severity} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
