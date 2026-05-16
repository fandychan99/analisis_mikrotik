import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, Plus, AlertTriangle, Info, Zap, X } from 'lucide-react';

function SeverityBadge({ severity }) {
    const map = {
        critical: 'bg-red-100 text-red-700 border border-red-200',
        warning:  'bg-amber-100 text-amber-700 border border-amber-200',
        info:     'bg-sky-100 text-sky-700 border border-sky-200',
    };
    const icons = { critical: Zap, warning: AlertTriangle, info: Info };
    const Icon = icons[severity] ?? Info;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[severity] ?? map.info}`}>
            <Icon size={10} />
            {severity}
        </span>
    );
}

function AddRuleModal({ open, onClose, device }) {
    const [form, setForm] = useState({
        metric_type: 'cpu_load',
        condition: 'gt',
        threshold_value: '',
        severity: 'warning',
        interface_name: '',
    });
    const [loading, setLoading] = useState(false);

    const metrics = [
        { value: 'cpu_load', label: 'CPU Load (%)' },
        { value: 'memory_percent', label: 'Memory (%)' },
        { value: 'disk_percent', label: 'Disk (%)' },
        { value: 'temperature', label: 'Temperature (°C)' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post('/alert-rules', form, {
            onSuccess: () => { setLoading(false); onClose(); },
            onError: () => setLoading(false),
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

export default function AlertsIndex({ alerts, rules, device, unresolved_count }) {
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [tab, setTab] = useState('alerts');

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

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Alert & Notifikasi
                        {unresolved_count > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                {unresolved_count}
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Monitoring alert dan aturan threshold</p>
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

            {!device && (
                <div className="chart-card py-16 text-center">
                    <BellOff size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Tambahkan perangkat terlebih dahulu</p>
                </div>
            )}

            {device && (
                <>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
                        {[
                            { key: 'alerts', label: 'Alert Log', count: alerts?.total },
                            { key: 'rules',  label: 'Aturan', count: rules?.length },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    tab === t.key ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {t.label}
                                {t.count > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 rounded-full text-[10px]">{t.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Alert Log */}
                    {tab === 'alerts' && (
                        <div className="space-y-3">
                            {alerts?.data?.length === 0 && (
                                <div className="chart-card py-12 text-center">
                                    <Bell size={36} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm">Tidak ada alert</p>
                                </div>
                            )}

                            {alerts?.data?.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                                        alert.is_resolved ? 'bg-slate-50 border-slate-200 opacity-60' :
                                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                                        alert.severity === 'warning'  ? 'bg-amber-50 border-amber-200' :
                                                                         'bg-sky-50 border-sky-200'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {alert.severity === 'critical' ? <Zap size={16} className="text-red-500" /> :
                                         alert.severity === 'warning'  ? <AlertTriangle size={16} className="text-amber-500" /> :
                                                                          <Info size={16} className="text-sky-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <SeverityBadge severity={alert.severity} />
                                            <span className="text-xs font-semibold text-slate-600">
                                                {metricLabel[alert.metric_type] ?? alert.metric_type}
                                                {alert.interface_name && ` — ${alert.interface_name}`}
                                            </span>
                                            {alert.is_resolved && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Selesai</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-700">{alert.message}</p>
                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                                            <span>🕐 {new Date(alert.triggered_at).toLocaleString('id-ID')}</span>
                                            {alert.actual_value !== null && <span>Nilai: {alert.actual_value}</span>}
                                            {alert.threshold_value !== null && <span>Threshold: {alert.threshold_value}</span>}
                                        </div>
                                    </div>
                                    {!alert.is_resolved && (
                                        <button
                                            onClick={() => resolveAlert(alert.id)}
                                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                                            title="Selesaikan"
                                        >
                                            <CheckCheck size={15} />
                                        </button>
                                    )}
                                </div>
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

                    {/* Rules */}
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
