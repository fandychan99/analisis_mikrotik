import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import {
    Server, Cpu, HardDrive, Wifi, WifiOff,
    AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
    Activity, Shield, TrendingUp
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

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Single info row used in device/system info panels.
 * @param {{ label: string, value: any }} props
 */
function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-400 min-w-[160px]">{label}</span>
            <span className="text-sm font-medium text-slate-700 text-right break-all">{value ?? '—'}</span>
        </div>
    );
}

/**
 * FCAPS badge strip. Active letter is highlighted.
 * @param {{ active: string }} props  – one of 'F','C','A','P','S'
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
            {caps.map(({ key, label, color }) => (
                key === active ? (
                    <span
                        key={key}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${color} shadow-md`}
                    >
                        <span className="font-black">{key}</span>
                        <span className="opacity-90">— {label}</span>
                    </span>
                ) : (
                    <span
                        key={key}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200"
                    >
                        <span className="font-bold">{key}</span>
                        <span className="hidden sm:inline opacity-70">— {label}</span>
                    </span>
                )
            ))}
        </div>
    );
}

/**
 * Gradient summary card.
 * @param {{ icon: React.Node, label: string, value: any, gradient: string, textColor: string }} props
 */
function SummaryCard({ icon, label, value, gradient, textColor }) {
    return (
        <div className={`rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-xs font-medium text-white/70">{label}</div>
                <div className={`text-2xl font-black ${textColor ?? 'text-white'}`}>{value}</div>
            </div>
        </div>
    );
}

/**
 * Health score progress ring (CSS only).
 * @param {{ score: number }} props  – 0-100
 */
function HealthRing({ score }) {
    const clamped = Math.max(0, Math.min(100, score));
    const color = clamped >= 80 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444';
    const label = clamped >= 80 ? 'Baik' : clamped >= 50 ? 'Perlu Perhatian' : 'Kritis';

    return (
        <div className="flex flex-col items-center justify-center gap-1">
            <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-black"
                style={{
                    background: `conic-gradient(${color} ${clamped * 3.6}deg, #e2e8f0 0deg)`,
                }}
            >
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-col">
                    <span className="text-lg font-black" style={{ color }}>{clamped}</span>
                </div>
            </div>
            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        </div>
    );
}

/**
 * Expandable interface table row.
 * @param {{ iface: object }} props
 */
function InterfaceRow({ iface }) {
    const [expanded, setExpanded] = useState(false);
    const hasError    = (iface.in_errors   || 0) + (iface.out_errors   || 0) > 0;
    const hasDiscards = (iface.in_discards || 0) + (iface.out_discards || 0) > 0;
    const isDown      = iface.oper_status !== 'up';

    const rowBg = isDown
        ? 'bg-red-50 hover:bg-red-100/60'
        : hasError
            ? 'bg-amber-50 hover:bg-amber-100/60'
            : 'bg-white hover:bg-slate-50';

    return (
        <>
            <tr
                className={`${rowBg} cursor-pointer transition-colors`}
                onClick={() => setExpanded(e => !e)}
            >
                <td>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${iface.oper_status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="font-semibold text-sky-700">{iface.name}</span>
                    </div>
                    {iface.desc && iface.desc !== iface.name && (
                        <div className="text-xs text-slate-400 ml-9">{iface.desc}</div>
                    )}
                </td>
                <td className="font-mono text-xs text-slate-500">{iface.mac || '—'}</td>
                <td className="text-slate-600">{iface.speed}</td>
                <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${iface.admin_status === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {iface.admin_status}
                    </span>
                </td>
                <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${iface.oper_status === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {iface.oper_status}
                    </span>
                </td>
                <td className="font-semibold text-emerald-600 text-sm">{formatBytes(iface.rx_bytes)}</td>
                <td className="font-semibold text-amber-600 text-sm">{formatBytes(iface.tx_bytes)}</td>
                <td className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-slate-300'}`}>
                    {hasError ? `${(iface.in_errors || 0).toLocaleString()} / ${(iface.out_errors || 0).toLocaleString()}` : '0 / 0'}
                </td>
                <td className={`text-sm font-medium ${hasDiscards ? 'text-orange-600' : 'text-slate-300'}`}>
                    {hasDiscards ? `${(iface.in_discards || 0).toLocaleString()} / ${(iface.out_discards || 0).toLocaleString()}` : '0 / 0'}
                </td>
            </tr>
            {expanded && (
                <tr className={rowBg}>
                    <td colSpan={9} className="pt-0 pb-3 px-4">
                        <div className="ml-9 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white/70 border border-slate-100 shadow-inner text-xs">
                            <div>
                                <span className="block text-slate-400 mb-0.5">Index</span>
                                <span className="font-semibold text-slate-700">{iface.if_index ?? '—'}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 mb-0.5">Tipe</span>
                                <span className="font-semibold text-slate-700">{iface.type ?? '—'}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 mb-0.5">Physical Address</span>
                                <span className="font-mono font-semibold text-slate-700">{iface.phys_address ?? iface.mac ?? '—'}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 mb-0.5">Last Updated</span>
                                <span className="font-semibold text-slate-700">{iface.last_updated ?? '—'}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * InventoryIndex — Configuration Management (C) — FCAPS
 *
 * @param {{ device: object, system_info: object, interfaces: Array<object> }} props
 */
export default function InventoryIndex({ device, system_info, interfaces }) {
    const info = system_info ?? {};

    // Filter state
    const [filter, setFilter] = useState('all'); // 'all' | 'up' | 'down' | 'errors'

    const upInterfaces   = interfaces.filter(i => i.oper_status === 'up');
    const downInterfaces = interfaces.filter(i => i.oper_status !== 'up');
    const totalErrors    = interfaces.reduce((s, i) => s + (i.in_errors   || 0) + (i.out_errors   || 0), 0);
    const totalDiscards  = interfaces.reduce((s, i) => s + (i.in_discards || 0) + (i.out_discards || 0), 0);

    // Health score: 100 - (error_rate*50) - (discard_rate*30) - (down_pct*20)
    const totalPkts     = interfaces.reduce((s, i) => s + (i.in_ucast_pkts || 0) + (i.out_ucast_pkts || 0), 1);
    const errorRate     = Math.min(1, totalErrors   / totalPkts);
    const discardRate   = Math.min(1, totalDiscards / totalPkts);
    const downPct       = interfaces.length > 0 ? downInterfaces.length / interfaces.length : 0;
    const healthScore   = Math.round(Math.max(0, 100 - errorRate * 50 - discardRate * 30 - downPct * 20));

    // Filtered interfaces
    const filtered = interfaces.filter(i => {
        if (filter === 'up')     return i.oper_status === 'up';
        if (filter === 'down')   return i.oper_status !== 'up';
        if (filter === 'errors') return (i.in_errors || 0) + (i.out_errors || 0) > 0;
        return true;
    });

    const filterBtns = [
        { key: 'all',    label: 'Semua',       count: interfaces.length },
        { key: 'up',     label: 'Up',          count: upInterfaces.length },
        { key: 'down',   label: 'Down',        count: downInterfaces.length },
        { key: 'errors', label: 'Ada Error',   count: interfaces.filter(i => (i.in_errors || 0) + (i.out_errors || 0) > 0).length },
    ];

    const upRatio = interfaces.length > 0 ? (upInterfaces.length / interfaces.length) * 100 : 0;

    return (
        <AppLayout title="Inventory Perangkat">
            <Head title="Inventory" />

            {/* Page title */}
            <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-800">Inventory Perangkat</h2>
                <p className="text-sm text-slate-500 mt-0.5">Manajemen Konfigurasi — FCAPS</p>
            </div>

            {/* FCAPS Badge Strip */}
            <FcapsBadge active="C" />

            {!device ? (
                <div className="chart-card py-16 text-center">
                    <Server size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Belum ada perangkat terkonfigurasi</p>
                </div>
            ) : (
                <>
                    {/* ── Gradient Summary Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <SummaryCard
                            icon={<Wifi size={18} className="text-white" />}
                            label="Interface Up"
                            value={upInterfaces.length}
                            gradient="from-emerald-500 to-teal-600"
                        />
                        <SummaryCard
                            icon={<WifiOff size={18} className="text-white" />}
                            label="Interface Down"
                            value={downInterfaces.length}
                            gradient="from-red-500 to-rose-600"
                        />
                        <SummaryCard
                            icon={<AlertTriangle size={18} className="text-white" />}
                            label="Total Errors"
                            value={totalErrors.toLocaleString()}
                            gradient={totalErrors > 0 ? "from-amber-500 to-orange-600" : "from-slate-300 to-slate-400"}
                        />
                        <SummaryCard
                            icon={<Activity size={18} className="text-white" />}
                            label="Total Discards"
                            value={totalDiscards.toLocaleString()}
                            gradient={totalDiscards > 0 ? "from-orange-500 to-red-500" : "from-slate-300 to-slate-400"}
                        />
                    </div>

                    {/* ── Health Ringkasan ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield size={15} className="text-sky-500" />
                            <h3 className="font-bold text-slate-700">Health Ringkasan</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                            {/* Health ring */}
                            <div className="flex justify-center sm:col-span-1">
                                <HealthRing score={healthScore} />
                            </div>

                            {/* Stats */}
                            <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400 mb-1">Total Interface</div>
                                    <div className="text-2xl font-black text-slate-700">{interfaces.length}</div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400 mb-1">Up / Down</div>
                                    <div className="text-2xl font-black text-slate-700">
                                        <span className="text-emerald-600">{upInterfaces.length}</span>
                                        <span className="text-slate-300 mx-1">/</span>
                                        <span className="text-red-500">{downInterfaces.length}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                                            style={{ width: `${upRatio}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">{upRatio.toFixed(0)}% up</div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400 mb-1">Total Errors</div>
                                    <div className={`text-2xl font-black ${totalErrors > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                        {totalErrors.toLocaleString()}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400 mb-1">Total Discards</div>
                                    <div className={`text-2xl font-black ${totalDiscards > 0 ? 'text-orange-600' : 'text-slate-300'}`}>
                                        {totalDiscards.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Device + System Info ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Server size={16} className="text-sky-500" />
                                <h3 className="font-bold text-slate-700">Informasi Perangkat</h3>
                            </div>
                            <div className="px-5 py-2">
                                <InfoRow label="Nama"           value={device.name} />
                                <InfoRow label="IP Address"     value={device.ip_address} />
                                <InfoRow label="SNMP Version"   value={`v${device.snmp_version}`} />
                                <InfoRow label="SNMP Community" value={device.snmp_community} />
                                <InfoRow label="Lokasi"         value={device.location} />
                                <InfoRow label="Status"         value={device.status} />
                                <InfoRow label="Last Polled"    value={device.last_polled_at} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Cpu size={16} className="text-violet-500" />
                                <h3 className="font-bold text-slate-700">System Info (SNMP)</h3>
                            </div>
                            <div className="px-5 py-2">
                                <InfoRow label="sysName"     value={info.sys_name} />
                                <InfoRow label="sysDescr"    value={info.sys_descr} />
                                <InfoRow label="sysContact"  value={info.sys_contact} />
                                <InfoRow label="sysLocation" value={info.sys_location} />
                                <InfoRow label="Uptime"      value={info.uptime_formatted} />
                                <InfoRow label="RouterOS"    value={info.routeros_version} />
                                <InfoRow label="Board"       value={info.board_name} />
                            </div>
                        </div>
                    </div>

                    {/* ── Interface Table ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <HardDrive size={16} className="text-emerald-500" />
                                <h3 className="font-bold text-slate-700">Semua Interface</h3>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {filtered.length} / {interfaces.length}
                                </span>
                            </div>
                            {/* Filter buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {filterBtns.map(btn => (
                                    <button
                                        key={btn.key}
                                        onClick={() => setFilter(btn.key)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                                            filter === btn.key
                                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                                        }`}
                                    >
                                        {btn.label}
                                        <span className={`ml-1 px-1.5 rounded-full ${filter === btn.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {btn.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Interface</th>
                                        <th>MAC Address</th>
                                        <th>Speed</th>
                                        <th>Admin</th>
                                        <th>Status</th>
                                        <th className="text-emerald-700">Rx Bytes</th>
                                        <th className="text-amber-700">Tx Bytes</th>
                                        <th className="text-red-700">Errors (In/Out)</th>
                                        <th className="text-orange-700">Discards (In/Out)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(iface => (
                                        <InterfaceRow key={iface.id} iface={iface} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filtered.length === 0 && (
                            <div className="py-12 text-center text-slate-400">
                                <TrendingUp size={32} className="mx-auto mb-2 text-slate-200" />
                                <p className="text-sm">Tidak ada interface yang cocok dengan filter ini</p>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="px-5 py-3 border-t border-slate-50 flex flex-wrap gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block" /> Up
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Down
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" /> Ada Error
                            </span>
                            <span className="flex items-center gap-1.5 ml-auto">
                                <ChevronRight size={12} /> Klik baris untuk detail
                            </span>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
