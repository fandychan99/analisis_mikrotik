import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, Plus, AlertTriangle, Info, Zap, X } from 'lucide-react';

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Severity badge pill.
 * @param {{ severity: 'critical'|'warning'|'info' }} props
 */
function SeverityBadge({ severity }) {
    const map = {
        critical: 'bg-red-100 text-red-700 border border-red-200',
        warning:  'bg-amber-100 text-amber-700 border border-amber-200',
        info:     'bg-sky-100 text-sky-700 border border-sky-200',
    };
    const icons = { critical: Zap, warning: AlertTriangle, info: Info };
    const Icon  = icons[severity] ?? Info;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[severity] ?? map.info}`}>
            <Icon size={10} />
            {severity}
        </span>
    );
}

/**
 * FCAPS badge strip. Active letter highlighted.
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
 * 24-hour severity heatmap rendered as an inline SVG bar chart.
 * Buckets alerts from the last 24 hours into hourly bins.
 *
 * @param {{ alerts: Array<object> }} props
 *   alerts[] must have `triggered_at` (ISO string) and `severity` fields.
 */
function SeverityHeatmap({ alerts }) {
    const now   = Date.now();
    const oneH  = 3_600_000;

    // Build 24 hourly buckets (index 0 = 23h ago … index 23 = current hour)
    const buckets = Array.from({ length: 24 }, (_, i) => {
        const start = now - (23 - i) * oneH;
        const end   = start + oneH;
        const items = (alerts ?? []).filter(a => {
            const t = new Date(a.triggered_at).getTime();
            return t >= start && t < end;
        });
        return {
            hour: new Date(start).getHours(),
            critical: items.filter(a => a.severity === 'critical').length,
            warning:  items.filter(a => a.severity === 'warning').length,
            info:     items.filter(a => a.severity === 'info').length,
            total:    items.length,
        };
    });

    const maxTotal = Math.max(1, ...buckets.map(b => b.total));

    const W   = 720;   // SVG viewBox width
    const H   = 72;    // SVG viewBox height (bar area)
    const BAR = (W / 24) - 2; // bar width with gap

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Bell size={15} className="text-red-500" />
                    <h3 className="font-bold text-slate-700">Aktivitas Alert 24 Jam Terakhir</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Critical
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Warning
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" /> Info
                    </span>
                </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${W} ${H + 20}`}
                    width="100%"
                    className="min-w-[420px]"
                    aria-label="Alert heatmap last 24 hours"
                >
                    {buckets.map((b, i) => {
                        const x       = i * (W / 24) + 1;
                        const totalH  = (b.total    / maxTotal) * H;
                        const critH   = (b.critical / maxTotal) * H;
                        const warnH   = (b.warning  / maxTotal) * H;
                        const infoH   = totalH - critH - warnH;

                        let yOffset = H;

                        // Info (bottom)
                        const infoY = yOffset - infoH;
                        yOffset     = infoY;
                        // Warning (middle)
                        const warnY = yOffset - warnH;
                        yOffset     = warnY;
                        // Critical (top)
                        const critY = yOffset - critH;

                        const isCurrentHour = i === 23;

                        return (
                            <g key={i}>
                                {/* Background column */}
                                <rect
                                    x={x} y={0} width={BAR} height={H}
                                    fill={isCurrentHour ? '#f0f9ff' : '#f8fafc'}
                                    rx={3}
                                />
                                {/* Info bar */}
                                {infoH > 0 && (
                                    <rect x={x} y={infoY} width={BAR} height={infoH} fill="#38bdf8" rx={2} opacity={0.85} />
                                )}
                                {/* Warning bar */}
                                {warnH > 0 && (
                                    <rect x={x} y={warnY} width={BAR} height={warnH} fill="#fbbf24" rx={2} opacity={0.9} />
                                )}
                                {/* Critical bar */}
                                {critH > 0 && (
                                    <rect x={x} y={critY} width={BAR} height={critH} fill="#f87171" rx={2} />
                                )}
                                {/* Hour label */}
                                <text
                                    x={x + BAR / 2} y={H + 14}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fill={isCurrentHour ? '#0ea5e9' : '#94a3b8'}
                                    fontWeight={isCurrentHour ? 700 : 400}
                                >
                                    {String(b.hour).padStart(2, '0')}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
            <p className="text-xs text-slate-400 mt-1 text-center">
                Jam (00–23) • sekarang → kanan
            </p>
        </div>
    );
}

/**
 * Visual alert card with left severity color bar and large icon.
 * @param {{ alert: object, onResolve: Function }} props
 */
function AlertCard({ alert, onResolve }) {
    const metricLabel = {
        cpu_load:       'CPU Load',
        memory_percent: 'Memory %',
        disk_percent:   'Disk %',
        temperature:    'Temperature',
        interface_down: 'Interface Down',
    };

    const severityConfig = {
        critical: {
            bar:    'bg-gradient-to-b from-red-500 to-rose-600',
            bg:     'bg-red-50',
            border: 'border-red-200',
            icon:   <Zap size={28} className="text-red-500" />,
            iconBg: 'bg-red-100',
        },
        warning: {
            bar:    'bg-gradient-to-b from-amber-400 to-orange-500',
            bg:     'bg-amber-50',
            border: 'border-amber-200',
            icon:   <AlertTriangle size={28} className="text-amber-500" />,
            iconBg: 'bg-amber-100',
        },
        info: {
            bar:    'bg-gradient-to-b from-sky-400 to-blue-500',
            bg:     'bg-sky-50',
            border: 'border-sky-200',
            icon:   <Info size={28} className="text-sky-500" />,
            iconBg: 'bg-sky-100',
        },
    };

    const cfg = severityConfig[alert.severity] ?? severityConfig.info;

    return (
        <div className={`flex rounded-xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${
            alert.is_resolved
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : `${cfg.bg} ${cfg.border}`
        }`}>
            {/* Left severity color bar */}
            <div className={`w-1.5 flex-shrink-0 ${alert.is_resolved ? 'bg-slate-300' : cfg.bar}`} />

            {/* Large icon */}
            <div className={`flex-shrink-0 flex items-center justify-center w-14 ${alert.is_resolved ? 'bg-slate-100' : cfg.iconBg}`}>
                <div className={alert.is_resolved ? 'opacity-30' : ''}>
                    {alert.severity === 'critical' ? <Zap size={28} className="text-red-500" />
                     : alert.severity === 'warning' ? <AlertTriangle size={28} className="text-amber-500" />
                     : <Info size={28} className="text-sky-500" />}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-semibold text-slate-600">
                        {metricLabel[alert.metric_type] ?? alert.metric_type}
                        {alert.interface_name && ` — ${alert.interface_name}`}
                    </span>
                    {alert.is_resolved && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                            ✓ Selesai
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-700 font-medium">{alert.message}</p>
                <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-slate-400">
                    <span>🕐 {new Date(alert.triggered_at).toLocaleString('id-ID')}</span>
                    {alert.actual_value    !== null && <span className="bg-white/60 px-2 py-0.5 rounded-full border border-slate-200">Nilai: <strong>{alert.actual_value}</strong></span>}
                    {alert.threshold_value !== null && <span className="bg-white/60 px-2 py-0.5 rounded-full border border-slate-200">Threshold: <strong>{alert.threshold_value}</strong></span>}
                </div>
            </div>

            {/* Resolve button */}
            {!alert.is_resolved && (
                <div className="flex-shrink-0 flex items-center pr-3">
                    <button
                        onClick={() => onResolve(alert.id)}
                        className="p-2 rounded-xl hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Selesaikan"
                    >
                        <CheckCheck size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Modal for adding a new alert rule.
 * @param {{ open: boolean, onClose: Function, device: object }} props
 */
function AddRuleModal({ open, onClose, device }) {
    const [form, setForm] = useState({
        metric_type:     'cpu_load',
        condition:       'gt',
        threshold_value: '',
        severity:        'warning',
        interface_name:  '',
    });
    const [loading, setLoading] = useState(false);

    const metrics = [
        { value: 'cpu_load',       label: 'CPU Load (%)' },
        { value: 'memory_percent', label: 'Memory (%)' },
        { value: 'disk_percent',   label: 'Disk (%)' },
        { value: 'temperature',    label: 'Temperature (°C)' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post('/alert-rules', form, {
            onSuccess: () => { setLoading(false); onClose(); },
            onError:   () => setLoading(false),
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800">Tambah Aturan Alert</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="form-label">Metrik</label>
                        <select className="form-select" value={form.metric_type} onChange={e => setForm(f => ({ ...f, metric_type: e.target.value }))}>
                            {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Kondisi</label>
                            <select className="form-select" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                                <option value="gt">Lebih dari (&gt;)</option>
                                <option value="lt">Kurang dari (&lt;)</option>
                                <option value="eq">Sama dengan (=)</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Nilai Threshold</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.threshold_value}
                                onChange={e => setForm(f => ({ ...f, threshold_value: e.target.value }))}
                                placeholder="80"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Severity</label>
                        <select className="form-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary text-xs py-2">Batal</button>
                        <button type="submit" disabled={loading} className="btn-primary text-xs py-2">
                            <Plus size={13} /> Tambah Aturan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * AlertsIndex — Fault Management (F) — FCAPS
 *
 * @param {{ alerts: object, rules: Array<object>, device: object, unresolved_count: number }} props
 *   alerts  — Laravel paginator object with { data, total, last_page, links }
 *   rules   — array of alert rule objects
 */
export default function AlertsIndex({ alerts, rules, device, unresolved_count }) {
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [tab, setTab]                     = useState('alerts');

    const resolveAlert = (id) => {
        router.post(`/alerts/${id}/resolve`);
    };

    const resolveAll = () => {
        if (confirm('Tandai semua alert sebagai selesai?')) {
            router.post('/alerts/resolve-all');
        }
    };

    const deleteRule = (id) => {
        if (confirm('Hapus aturan alert ini?')) {
            router.delete(`/alert-rules/${id}`);
        }
    };

    const metricLabel = {
        cpu_load:       'CPU Load',
        memory_percent: 'Memory %',
        disk_percent:   'Disk %',
        temperature:    'Temperature',
        interface_down: 'Interface Down',
    };

    return (
        <AppLayout title="Alert">
            <Head title="Alert" />

            {/* Page title */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Alert &amp; Notifikasi
                        {unresolved_count > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                                {unresolved_count}
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manajemen Fault — FCAPS</p>
                </div>
                <div className="flex items-center gap-2">
                    {unresolved_count > 0 && (
                        <button onClick={resolveAll} className="btn-success text-xs py-2">
                            <CheckCheck size={13} /> Selesaikan Semua
                        </button>
                    )}
                    <button onClick={() => setShowRuleModal(true)} className="btn-primary text-xs py-2" disabled={!device}>
                        <Plus size={13} /> Aturan Alert
                    </button>
                </div>
            </div>

            {/* FCAPS Badge Strip */}
            <FcapsBadge active="F" />

            {!device && (
                <div className="chart-card py-16 text-center">
                    <BellOff size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Tambahkan perangkat terlebih dahulu</p>
                </div>
            )}

            {device && (
                <>
                    {/* ── 24h Severity Heatmap ── */}
                    <SeverityHeatmap alerts={alerts?.data ?? []} />

                    {/* ── Tabs ── */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
                        {[
                            { key: 'alerts', label: 'Alert Log', count: alerts?.total },
                            { key: 'rules',  label: 'Aturan',   count: rules?.length },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    tab === t.key ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {t.label}
                                {t.count > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 rounded-full text-[10px]">{t.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Alert Log ── */}
                    {tab === 'alerts' && (
                        <div className="space-y-3">
                            {alerts?.data?.length === 0 && (
                                <div className="chart-card py-12 text-center">
                                    <Bell size={36} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm">Tidak ada alert</p>
                                </div>
                            )}

                            {alerts?.data?.map(alert => (
                                <AlertCard key={alert.id} alert={alert} onResolve={resolveAlert} />
                            ))}

                            {/* Pagination */}
                            {alerts?.last_page > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {alerts.links?.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                                link.active
                                                    ? 'bg-sky-600 text-white'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Rules ── */}
                    {tab === 'rules' && (
                        <div>
                            {rules?.length === 0 ? (
                                <div className="chart-card py-12 text-center">
                                    <AlertTriangle size={36} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm mb-3">Belum ada aturan alert</p>
                                    <button onClick={() => setShowRuleModal(true)} className="btn-primary mx-auto text-xs">
                                        <Plus size={13} /> Tambah Aturan
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full data-table">
                                        <thead>
                                            <tr>
                                                <th>Metrik</th>
                                                <th>Kondisi</th>
                                                <th>Threshold</th>
                                                <th>Severity</th>
                                                <th>Status</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rules.map(rule => (
                                                <tr key={rule.id}>
                                                    <td className="font-semibold">{metricLabel[rule.metric_type] ?? rule.metric_type}</td>
                                                    <td className="text-slate-400">
                                                        {{ gt: 'Lebih dari', lt: 'Kurang dari', eq: 'Sama dengan' }[rule.condition]}
                                                    </td>
                                                    <td className="font-bold text-slate-800">{rule.threshold_value}</td>
                                                    <td><SeverityBadge severity={rule.severity} /></td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {rule.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <AddRuleModal open={showRuleModal} onClose={() => setShowRuleModal(false)} device={device} />
        </AppLayout>
    );
}
