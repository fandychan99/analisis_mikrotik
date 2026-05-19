import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { Users, Wifi, WifiOff, Database, Search, RefreshCw } from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const b = Number(bytes);
    if (b >= 1_099_511_627_776) return (b / 1_099_511_627_776).toFixed(1) + ' TB';
    if (b >= 1_073_741_824)     return (b / 1_073_741_824).toFixed(1) + ' GB';
    if (b >= 1_048_576)         return (b / 1_048_576).toFixed(1) + ' MB';
    if (b >= 1_024)             return (b / 1_024).toFixed(1) + ' KB';
    return b + ' B';
}

export default function PppoeIndex({ device, sessions, summary, search: initialSearch }) {
    const [search, setSearch] = useState(initialSearch ?? '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/pppoe', { search }, { preserveState: true, replace: true });
    };

    const handleRefresh = () => {
        router.reload({ only: ['sessions', 'summary'] });
    };

    return (
        <AppLayout title="PPPoE Klien">
            <Head title="PPPoE Klien" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">PPPoE Klien Aktif</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Accounting Management (A) — FCAPS
                    </p>
                </div>
                <div className="flex gap-2">
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
                    <button onClick={handleRefresh} className="btn-secondary text-xs py-2">
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                </div>
            </div>

            {!device ? (
                <div className="chart-card py-16 text-center">
                    <Users size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Belum ada perangkat terkonfigurasi</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
                                <Users size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Total Sesi</div>
                                <div className="text-xl font-bold text-slate-700">{summary.total}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                                <Wifi size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Aktif</div>
                                <div className="text-xl font-bold text-emerald-600">{summary.active}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-400 flex items-center justify-center">
                                <WifiOff size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Disconnected</div>
                                <div className="text-xl font-bold text-slate-500">{summary.disconnected}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center">
                                <Database size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Total Rx</div>
                                <div className="text-base font-bold text-emerald-600">{formatBytes(summary.total_rx)}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
                                <Database size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Total Tx</div>
                                <div className="text-base font-bold text-amber-600">{formatBytes(summary.total_tx)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Sessions Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-sky-500" />
                                <h3 className="font-bold text-slate-700">Daftar Sesi PPPoE</h3>
                            </div>
                            <span className="text-xs text-slate-400">{sessions.length} sesi ditampilkan</span>
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
                                            <th>Username</th>
                                            <th>IP Client</th>
                                            <th>Service</th>
                                            <th>Interface</th>
                                            <th>Uptime</th>
                                            <th className="text-emerald-700">Rx (↓)</th>
                                            <th className="text-amber-700">Tx (↑)</th>
                                            <th>Status</th>
                                            <th>Terakhir Dilihat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map((s) => (
                                            <tr key={s.id}>
                                                <td className="font-semibold text-sky-700">{s.username}</td>
                                                <td className="font-mono text-sm text-slate-600">{s.caller_id || '—'}</td>
                                                <td className="text-slate-500">{s.service || '—'}</td>
                                                <td className="font-mono text-xs text-slate-500">{s.interface_name || '—'}</td>
                                                <td className="text-slate-600">{s.uptime_formatted}</td>
                                                <td className="font-semibold text-emerald-600">{s.rx_formatted}</td>
                                                <td className="font-semibold text-amber-600">{s.tx_formatted}</td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        s.state === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {s.state === 'active' ? '● Aktif' : '○ Disconnected'}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-slate-400">{s.last_seen_at}</td>
                                            </tr>
                                        ))}
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
