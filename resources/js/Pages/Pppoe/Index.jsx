import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useMemo } from 'react';
import {
    Users, Wifi, WifiOff, Database, Search, RefreshCw,
    Download, Clock, ArrowUpDown, ArrowUp, ArrowDown, Trophy
} from 'lucide-react';

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const b = Number(bytes);
    if (b >= 1_099_511_627_776) return (b / 1_099_511_627_776).toFixed(1) + ' TB';
    if (b >= 1_073_741_824)     return (b / 1_073_741_824).toFixed(1) + ' GB';
    if (b >= 1_048_576)         return (b / 1_048_576).toFixed(1) + ' MB';
    if (b >= 1_024)             return (b / 1_024).toFixed(1) + ' KB';
    return b + ' B';
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd …).
 * @param {number} n
 * @returns {string}
 */
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Export sessions array to a CSV file download.
 * @param {Array<object>} sessions
 */
function exportCsv(sessions) {
    const headers = ['username', 'ip_client', 'service', 'interface', 'uptime', 'rx_bytes', 'tx_bytes', 'state', 'last_seen'];
    const rows = sessions.map(s => [
        s.username,
        s.caller_id   ?? '',
        s.service      ?? '',
        s.interface_name ?? '',
        s.uptime_formatted ?? '',
        s.rx_bytes     ?? 0,
        s.tx_bytes     ?? 0,
        s.state        ?? '',
        s.last_seen_at ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pppoe-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * FCAPS badge strip. Active letter highlighted with gradient pill.
 * @param {{ active: string }} props
 */
function FcapsBadge({ active }) {
    const caps = [
        { key: 'F', label: 'Fault',         color: 'from-red-500 to-rose-600' },
        { key: 'C', label: 'Configuration', color: 'from-sky-500 to-indigo-600' },
        { key: 'A', label: 'Accounting',    color: 'from-emerald-500 to-teal-600' },
        { key: 'P', label: 'Performance',   color: 'from-violet-500 to-purple-600' },
        { key: 'S', label: 'Security',      color: 'from-amber-500 to-orange-600' },
    ];
    return (
        <div className="flex items-center gap-2 flex-wrap mb-6">
            {caps.map(({ key, label, color }) =>
                key === active ? (
                    <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${color} shadow-md`}>
                        <span className="font-black">{key}</span>
                        <span className="opacity-90">— {label}</span>
                    </span>
                ) : (
                    <span key={key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200">
                        <span className="font-bold">{key}</span>
                        <span className="hidden sm:inline opacity-70">— {label}</span>
                    </span>
                )
            )}
        </div>
    );
}

/**
 * CSS-only donut chart using conic-gradient.
 * Shows active vs total sessions.
 * @param {{ active: number, total: number }} props
 */
function DonutChart({ active, total }) {
    const pct     = total > 0 ? (active / total) * 100 : 0;
    const deg     = (pct / 100) * 360;
    const inactive = total - active;

    return (
        <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
                <div
                    className="w-24 h-24 rounded-full"
                    style={{
                        background: `conic-gradient(#10b981 ${deg}deg, #e2e8f0 0deg)`,
                    }}
                />
                {/* Hole */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white flex flex-col items-center justify-center">
                        <span className="text-base font-black text-emerald-600">{pct.toFixed(0)}%</span>
                        <span className="text-[9px] text-slate-400 leading-none">aktif</span>
                    </div>
                </div>
            </div>
            <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-slate-600">Aktif: <strong className="text-emerald-600">{active}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
                    <span className="text-slate-600">Disconnected: <strong className="text-slate-500">{inactive}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                    <span className="text-slate-600">Total: <strong className="text-slate-700">{total}</strong></span>
                </div>
            </div>
        </div>
    );
}

/**
 * Last polling timeline indicator.
 * @param {{ lastPolled: string|null }} props
 */
function PollTimeline({ lastPolled }) {
    if (!lastPolled) return null;
    const dt   = new Date(lastPolled);
    const now  = new Date();
    const diff = Math.round((now - dt) / 1000); // seconds ago
    const ago  = diff < 60  ? `${diff} detik lalu`
               : diff < 3600 ? `${Math.round(diff / 60)} menit lalu`
               : `${Math.round(diff / 3600)} jam lalu`;
    const fresh = diff < 300; // < 5 min = fresh

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
            <Clock size={12} className={fresh ? 'text-emerald-500' : 'text-amber-500'} />
            <span>Polling terakhir:</span>
            <span className={`font-semibold ${fresh ? 'text-emerald-600' : 'text-amber-600'}`}>
                {dt.toLocaleString('id-ID')}
            </span>
            <span className="text-slate-400">({ago})</span>
            <span className={`ml-1 w-2 h-2 rounded-full ${fresh ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>
    );
}

/**
 * Sort header button for table columns.
 * @param {{ label: string, sortKey: string, current: string, dir: string, onSort: Function }} props
 */
function SortHeader({ label, sortKey, current, dir, onSort }) {
    const active = current === sortKey;
    return (
        <button
            onClick={() => onSort(sortKey)}
            className={`flex items-center gap-1 font-semibold transition-colors ${
                active ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
            {label}
            {active
                ? (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                : <ArrowUpDown size={11} className="opacity-40" />
            }
        </button>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * PppoeIndex — Accounting Management (A) — FCAPS
 *
 * @param {{ device: object, sessions: Array<object>, summary: object, search: string }} props
 */
export default function PppoeIndex({ device, sessions, summary, search: initialSearch }) {
    const [search, setSearch]     = useState(initialSearch ?? '');
    const [sortKey, setSortKey]   = useState('username');
    const [sortDir, setSortDir]   = useState('asc');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/pppoe', { search }, { preserveState: true, replace: true });
    };

    const handleRefresh = () => {
        router.reload({ only: ['sessions', 'summary'] });
    };

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    // Client-side sort
    const sorted = useMemo(() => {
        return [...sessions].sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === 'rx_bytes' || sortKey === 'tx_bytes') {
                av = Number(av) || 0;
                bv = Number(bv) || 0;
            } else {
                av = String(av ?? '').toLowerCase();
                bv = String(bv ?? '').toLowerCase();
            }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ?  1 : -1;
            return 0;
        });
    }, [sessions, sortKey, sortDir]);

    // Build bandwidth rank (by rx_bytes desc)
    const rankMap = useMemo(() => {
        const byRx = [...sessions].sort((a, b) => (Number(b.rx_bytes) || 0) - (Number(a.rx_bytes) || 0));
        const m = {};
        byRx.forEach((s, i) => { m[s.id] = i + 1; });
        return m;
    }, [sessions]);

    return (
        <AppLayout title="PPPoE Klien">
            <Head title="PPPoE Klien" />

            {/* Page title */}
            <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-800">PPPoE Klien Aktif</h2>
                <p className="text-sm text-slate-500 mt-0.5">Manajemen Akuntansi — FCAPS</p>
            </div>

            {/* FCAPS Badge Strip */}
            <FcapsBadge active="A" />

            {!device ? (
                <div className="chart-card py-16 text-center">
                    <Users size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Belum ada perangkat terkonfigurasi</p>
                </div>
            ) : (
                <>
                    {/* ── Top Controls ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <PollTimeline lastPolled={device.last_polled_at} />
                        <div className="flex gap-2 flex-wrap">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Cari username / IP..."
                                        className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white w-48"
                                    />
                                </div>
                                <button type="submit" className="btn-secondary text-xs py-2">Cari</button>
                            </form>
                            <button
                                onClick={() => exportCsv(sessions)}
                                className="btn-secondary text-xs py-2 flex items-center gap-1"
                                title="Export CSV"
                            >
                                <Download size={13} />
                                Export CSV
                            </button>
                            <button onClick={handleRefresh} className="btn-secondary text-xs py-2 flex items-center gap-1">
                                <RefreshCw size={13} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* ── Donut + Summary Cards ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
                        {/* Donut chart card */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center">
                            <DonutChart active={summary.active ?? 0} total={summary.total ?? 0} />
                        </div>

                        {/* Metric cards */}
                        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                {
                                    icon: <Users size={16} className="text-white" />,
                                    label: 'Total Sesi',
                                    value: summary.total,
                                    gradient: 'from-sky-500 to-indigo-600',
                                },
                                {
                                    icon: <Wifi size={16} className="text-white" />,
                                    label: 'Aktif',
                                    value: summary.active,
                                    gradient: 'from-emerald-500 to-teal-600',
                                },
                                {
                                    icon: <WifiOff size={16} className="text-white" />,
                                    label: 'Disconnected',
                                    value: summary.disconnected,
                                    gradient: 'from-slate-400 to-slate-500',
                                },
                                {
                                    icon: <Database size={16} className="text-white" />,
                                    label: 'Total Rx',
                                    value: formatBytes(summary.total_rx),
                                    gradient: 'from-emerald-400 to-cyan-500',
                                },
                                {
                                    icon: <Database size={16} className="text-white" />,
                                    label: 'Total Tx',
                                    value: formatBytes(summary.total_tx),
                                    gradient: 'from-amber-400 to-orange-500',
                                },
                            ].map((c, i) => (
                                <div key={i} className={`rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg bg-gradient-to-br ${c.gradient}`}>
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                        {c.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs text-white/70">{c.label}</div>
                                        <div className="text-lg font-black">{c.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Sessions Table ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-sky-500" />
                                <h3 className="font-bold text-slate-700">Daftar Sesi PPPoE</h3>
                            </div>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {sessions.length} sesi
                            </span>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users size={40} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-slate-400 text-sm">
                                    {summary.total === 0
                                        ? 'Belum ada sesi PPPoE. Tunggu polling SNMP berikutnya.'
                                        : 'Tidak ada sesi yang cocok dengan pencarian.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full data-table">
                                    <thead>
                                        <tr>
                                            <th><SortHeader label="Username"  sortKey="username"  current={sortKey} dir={sortDir} onSort={handleSort} /></th>
                                            <th>IP Client</th>
                                            <th>Service</th>
                                            <th>Interface</th>
                                            <th><SortHeader label="Uptime"    sortKey="uptime_seconds" current={sortKey} dir={sortDir} onSort={handleSort} /></th>
                                            <th className="text-emerald-700"><SortHeader label="Rx (↓)" sortKey="rx_bytes" current={sortKey} dir={sortDir} onSort={handleSort} /></th>
                                            <th className="text-amber-700"><SortHeader label="Tx (↑)"  sortKey="tx_bytes" current={sortKey} dir={sortDir} onSort={handleSort} /></th>
                                            <th>
                                                <span className="flex items-center gap-1">
                                                    <Trophy size={11} className="text-amber-500" /> Rank BW
                                                </span>
                                            </th>
                                            <th>Status</th>
                                            <th>Terakhir Dilihat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.map((s) => {
                                            const isActive = s.state === 'active';
                                            const rank     = rankMap[s.id];
                                            return (
                                                <tr key={s.id} className={isActive ? 'bg-white' : 'bg-slate-50/50'}>
                                                    <td className="font-semibold text-sky-700">{s.username}</td>
                                                    <td className="font-mono text-sm text-slate-600">{s.caller_id || '—'}</td>
                                                    <td className="text-slate-500">{s.service || '—'}</td>
                                                    <td className="font-mono text-xs text-slate-500">{s.interface_name || '—'}</td>
                                                    <td className="text-slate-600">{s.uptime_formatted}</td>
                                                    <td className="font-semibold text-emerald-600">{s.rx_formatted}</td>
                                                    <td className="font-semibold text-amber-600">{s.tx_formatted}</td>
                                                    <td>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            rank === 1 ? 'bg-amber-100 text-amber-700'
                                                            : rank === 2 ? 'bg-slate-100 text-slate-600'
                                                            : rank === 3 ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                            {rank === 1 && '🥇 '}
                                                            {rank === 2 && '🥈 '}
                                                            {rank === 3 && '🥉 '}
                                                            {ordinal(rank)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {isActive ? (
                                                                <>
                                                                    {/* Pulsing dot for active sessions */}
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                                    </span>
                                                                    Aktif
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                                                                    Disconnected
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs text-slate-400">{s.last_seen_at}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    );
}
