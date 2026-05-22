import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import axios from 'axios';
import {
    Plus, Router, Edit2, Trash2, CheckCircle, XCircle, Wifi,
    Clock, MapPin, Loader2, TestTube2, RefreshCw, Network,
    ChevronDown, ChevronUp, Layers, X, ArrowLeft, Server,
    Activity, HardDrive, MemoryStick, AlertTriangle
} from 'lucide-react';

/* ──────────────────────────────────────────
   Modal wrapper
────────────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl z-10">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Tutup"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────
   Device Form (used in Add & Edit modal)
────────────────────────────────────────── */
function DeviceForm({ device, onSubmit, onCancel, processing }) {
    const [formData, setFormData] = useState({
        name:             device?.name             ?? '',
        ip_address:       device?.ip_address       ?? '',
        snmp_community:   device?.snmp_community   ?? 'public',
        snmp_version:     device?.snmp_version     ?? '2c',
        snmp_port:        device?.snmp_port        ?? 161,
        description:      device?.description      ?? '',
        location:         device?.location         ?? '',
        polling_interval: device?.polling_interval ?? 30,
        is_demo:          device?.is_demo          ?? false,
    });

    const [testing, setTesting]       = useState(false);
    const [testResult, setTestResult] = useState(null);

    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const { data: res } = await axios.post('/devices/test-connection', {
                ip_address:     formData.ip_address,
                snmp_community: formData.snmp_community,
                snmp_version:   formData.snmp_version,
                snmp_port:      formData.snmp_port,
                is_demo:        formData.is_demo,
            });
            setTestResult(res);
        } catch (e) {
            setTestResult({ success: false, message: e.response?.data?.message ?? 'Error koneksi' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">

            {/* Demo Mode Toggle */}
            <div
                className={`rounded-xl p-4 border-2 cursor-pointer transition-all select-none ${
                    formData.is_demo
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => set('is_demo', !formData.is_demo)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        formData.is_demo ? 'bg-violet-600' : 'bg-slate-300'
                    }`}>
                        <Layers size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-sm">🎭 Mode Demo (Tanpa Perangkat)</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Data SNMP disimulasi secara realistis. Tidak perlu MikroTik fisik.
                        </div>
                    </div>
                    {/* Toggle switch */}
                    <div className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors ${formData.is_demo ? 'bg-violet-600' : 'bg-slate-300'}`}>
                        <div
                            className="w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform"
                            style={{ transform: formData.is_demo ? 'translateX(22px)' : 'translateX(2px)' }}
                        />
                    </div>
                </div>

                {formData.is_demo && (
                    <div className="mt-3 p-3 bg-violet-100 rounded-lg text-xs text-violet-800 space-y-0.5">
                        <div>✅ Simulasi MikroTik RB4011 (1 GB RAM, 512 MB Flash)</div>
                        <div>✅ 4 interface: ether1 (WAN), ether2 (LAN), wlan1, bridge1</div>
                        <div>✅ CPU, Memory, Disk, Suhu, dan Traffic berfluktuasi realistis</div>
                    </div>
                )}
            </div>

            {/* Nama */}
            <div>
                <label className="form-label">Nama Perangkat *</label>
                <input
                    className="form-input"
                    value={formData.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder={formData.is_demo ? 'MikroTik Demo' : 'MikroTik Kantor'}
                    required
                />
            </div>

            {/* SNMP fields — hanya jika bukan demo */}
            {!formData.is_demo && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Host / IP Address *</label>
                            <input
                                className="form-input"
                                value={formData.ip_address}
                                onChange={e => set('ip_address', e.target.value)}
                                placeholder="192.168.1.1 atau idn1.tunnel.id"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Port SNMP</label>
                            <input
                                className="form-input"
                                type="number"
                                value={formData.snmp_port}
                                onChange={e => set('snmp_port', e.target.value)}
                                min={1} max={65535}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Community String *</label>
                            <input
                                className="form-input"
                                value={formData.snmp_community}
                                onChange={e => set('snmp_community', e.target.value)}
                                placeholder="public"
                            />
                        </div>
                        <div>
                            <label className="form-label">SNMP Version</label>
                            <select className="form-select" value={formData.snmp_version} onChange={e => set('snmp_version', e.target.value)}>
                                <option value="1">SNMP v1</option>
                                <option value="2c">SNMP v2c</option>
                                <option value="3">SNMP v3</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="form-label">Lokasi</label>
                    <input className="form-input" value={formData.location} onChange={e => set('location', e.target.value)} placeholder="Server Room" />
                </div>
                <div>
                    <label className="form-label">Polling (detik)</label>
                    <input className="form-input" type="number" value={formData.polling_interval} onChange={e => set('polling_interval', e.target.value)} min={10} max={3600} />
                </div>
            </div>

            <div>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input resize-none" rows={2} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Keterangan perangkat..." />
            </div>

            {/* Test Koneksi */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">
                        {formData.is_demo ? '🎭 Verifikasi Mode Demo' : '🔌 Test Koneksi SNMP'}
                    </span>
                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={testing || (!formData.is_demo && !formData.ip_address)}
                        className="btn-secondary text-xs py-1.5"
                    >
                        {testing ? <Loader2 size={13} className="animate-spin" /> : <TestTube2 size={13} />}
                        {testing ? 'Testing...' : 'Test'}
                    </button>
                </div>
                {testResult && (
                    <div className={`p-3 rounded-xl text-sm ${testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {testResult.success ? (
                            <div>
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <CheckCircle size={14} />
                                    {formData.is_demo ? 'Mode Demo siap!' : 'Koneksi berhasil!'}
                                </div>
                                {testResult.sysname && <p className="text-xs opacity-80">System: {testResult.sysname}</p>}
                                {testResult.sys_info?.sys_descr && <p className="text-xs opacity-80 truncate">{testResult.sys_info.sys_descr}</p>}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 font-semibold">
                                <XCircle size={14} /> {testResult.message}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary text-sm">
                    <X size={14} /> Batal
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className={formData.is_demo ? 'btn-success' : 'btn-primary'}
                >
                    {processing
                        ? <Loader2 size={15} className="animate-spin" />
                        : formData.is_demo ? <Layers size={15} /> : <CheckCircle size={15} />
                    }
                    {device
                        ? 'Simpan Perubahan'
                        : formData.is_demo ? 'Aktifkan Mode Demo' : 'Tambah Perangkat'
                    }
                </button>
            </div>
        </form>
    );
}

/* ──────────────────────────────────────────
   Status Badge helper
────────────────────────────────────────── */
function StatusBadge({ status }) {
    if (status === 'online') return (
        <span className="badge-online">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online
        </span>
    );
    if (status === 'offline') return (
        <span className="badge-offline">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Offline
        </span>
    );
    return <span className="badge-unknown">Unknown</span>;
}

/* ──────────────────────────────────────────
   Empty State (no device)
────────────────────────────────────────── */
function EmptyState({ onAdd }) {
    return (
        <div className="chart-card text-center py-20">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center bg-slate-100">
                <Server size={36} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-600 mb-1">Belum ada perangkat</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
                Tambahkan perangkat MikroTik atau gunakan <strong>Mode Demo</strong> untuk
                mencoba semua fitur monitoring tanpa perangkat fisik.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    id="btn-demo"
                    onClick={() => onAdd('demo')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                >
                    <Layers size={15} /> Coba Mode Demo
                </button>
                <button id="btn-add" onClick={() => onAdd('real')} className="btn-secondary text-sm px-5">
                    <Plus size={15} /> Tambah Perangkat Nyata
                </button>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────
   Main Page
────────────────────────────────────────── */
export default function DevicesIndex({ device }) {
    const [modal, setModal]                 = useState(null); // null | 'add' | 'edit'
    const [polling, setPolling]             = useState(false);
    const [showInterfaces, setShowInterfaces] = useState(true);

    const openAdd  = (type) => setModal(type === 'demo' ? 'add-demo' : 'add');
    const closeModal = () => setModal(null);

    const handleStore = (data) => {
        router.post('/devices', data, { onSuccess: closeModal });
    };

    const handleUpdate = (data) => {
        router.put(`/devices/${device.id}`, data, { onSuccess: closeModal });
    };

    const handleDelete = () => {
        if (confirm('Hapus perangkat ini? Semua data metrik akan ikut terhapus.')) {
            router.delete(`/devices/${device.id}`);
        }
    };

    const handlePoll = async () => {
        if (!device) return;
        setPolling(true);
        try {
            await axios.post(`/devices/${device.id}/poll`);
            setTimeout(() => window.location.reload(), 3000);
        } catch (e) {
        } finally {
            setPolling(false);
        }
    };

    // Build default form data for "add-demo" quick-start
    const demoDefaults = modal === 'add-demo'
        ? { is_demo: true, name: 'MikroTik Demo', snmp_version: '2c' }
        : undefined;

    return (
        <AppLayout title="Manajemen Perangkat">
            <Head title="Perangkat" />

            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Perangkat SNMP</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Konfigurasi dan monitoring perangkat MikroTik</p>
                </div>

                {/* Action buttons — hanya tampil jika belum ada device */}
                {!device && (
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-demo-header"
                            onClick={() => openAdd('demo')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                        >
                            <Layers size={14} /> Mode Demo
                        </button>
                        <button id="btn-add-header" onClick={() => openAdd('real')} className="btn-primary text-sm">
                            <Plus size={14} /> Tambah
                        </button>
                    </div>
                )}

                {/* Jika sudah ada device — tombol edit/hapus/poll */}
                {device && (
                    <div className="flex items-center gap-2">
                        <button onClick={handlePoll} disabled={polling} className="btn-secondary text-xs py-2">
                            <RefreshCw size={13} className={polling ? 'animate-spin' : ''} />
                            {polling ? 'Polling...' : 'Poll Now'}
                        </button>
                        <button onClick={() => setModal('edit')} className="btn-secondary text-xs py-2">
                            <Edit2 size={13} /> Edit
                        </button>
                        <button onClick={handleDelete} className="btn-danger text-xs py-2">
                            <Trash2 size={13} /> Hapus
                        </button>
                    </div>
                )}
            </div>

            {/* ── No device: empty state ── */}
            {!device && <EmptyState onAdd={openAdd} />}

            {/* ── Device exists: info cards ── */}
            {device && (
                <div className="space-y-5">
                    {/* Demo Banner */}
                    {device.is_demo && (
                        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                            <Layers size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-violet-800 text-sm">Mode Demo Aktif</p>
                                <p className="text-xs text-violet-600 mt-0.5">
                                    Data yang ditampilkan adalah simulasi realistis MikroTik RB4011.
                                    Pastikan <code className="bg-violet-100 px-1 rounded">php artisan queue:work</code> dan{' '}
                                    <code className="bg-violet-100 px-1 rounded">php artisan schedule:work</code> sudah berjalan.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Main device card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Header row */}
                        <div className="p-5 flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                device.is_demo
                                    ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                                    : 'bg-gradient-to-br from-sky-500 to-blue-600'
                            }`}>
                                {device.is_demo
                                    ? <Layers size={26} className="text-white" />
                                    : <Router size={26} className="text-white" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-lg font-bold text-slate-800">{device.name}</h3>
                                    <StatusBadge status={device.status} />
                                    {device.is_demo && (
                                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full border border-violet-200">
                                            🎭 DEMO
                                        </span>
                                    )}
                                </div>
                                {device.description && (
                                    <p className="text-sm text-slate-500 mt-0.5">{device.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100">
                            {[
                                { icon: Network,  label: 'IP Address', value: device.is_demo ? 'Demo Mode' : device.ip_address },
                                { icon: Wifi,     label: 'SNMP',       value: device.is_demo ? 'Disimulasi' : `v${device.snmp_version} : ${device.snmp_community}` },
                                { icon: MapPin,   label: 'Lokasi',     value: device.location ?? '—' },
                                { icon: Clock,    label: 'Polling',    value: `${device.polling_interval}s` },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-4">
                                    <item.icon size={15} className="text-slate-400 flex-shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
                                        <div className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* System info */}
                        {device.system_info && Object.keys(device.system_info).length > 0 && (
                            <div className="border-t border-slate-100 p-5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">System Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[
                                        ['System Name',  device.system_info.sys_name],
                                        ['Description',  device.system_info.sys_descr],
                                        ['Uptime',       device.uptime_formatted],
                                        ['Location',     device.system_info.sys_location],
                                        ['Last Polled',  device.last_polled_at ? new Date(device.last_polled_at).toLocaleString('id-ID') : '—'],
                                    ].filter(([, v]) => v).map(([k, v]) => (
                                        <div key={k} className="flex gap-2 text-xs">
                                            <span className="text-slate-400 w-28 flex-shrink-0">{k}</span>
                                            <span className="font-medium text-slate-700">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interfaces collapsible */}
                    {device.interfaces && device.interfaces.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <button
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                onClick={() => setShowInterfaces(v => !v)}
                            >
                                <div>
                                    <span className="text-sm font-bold text-slate-800">Network Interfaces</span>
                                    <span className="ml-2 text-xs text-slate-400">
                                        ({device.interfaces.filter(i => i.if_oper_status === 'up').length} up
                                        / {device.interfaces.length} total)
                                    </span>
                                </div>
                                {showInterfaces
                                    ? <ChevronUp size={16} className="text-slate-400" />
                                    : <ChevronDown size={16} className="text-slate-400" />
                                }
                            </button>

                            {showInterfaces && (
                                <div className="border-t border-slate-100 overflow-x-auto">
                                    <table className="w-full data-table">
                                        <thead>
                                            <tr>
                                                <th>Nama</th>
                                                <th>Deskripsi</th>
                                                <th>Speed</th>
                                                <th>Admin</th>
                                                <th>Operasi</th>
                                                <th>MAC</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {device.interfaces.map(iface => (
                                                <tr key={iface.id}>
                                                    <td className="font-semibold text-sky-600">{iface.if_name}</td>
                                                    <td className="text-slate-500">{iface.if_desc}</td>
                                                    <td className="text-xs">
                                                        {iface.if_speed > 0
                                                            ? iface.if_speed >= 1_000_000_000
                                                                ? `${iface.if_speed / 1_000_000_000} Gbps`
                                                                : `${iface.if_speed / 1_000_000} Mbps`
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            iface.if_admin_status === 'up'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {iface.if_admin_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            iface.if_oper_status === 'up'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-red-50 text-red-700'
                                                        }`}>
                                                            {iface.if_oper_status}
                                                        </span>
                                                    </td>
                                                    <td className="font-mono text-slate-400 text-xs">{iface.if_phys_address ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Modal ── */}
            <Modal
                open={modal === 'add' || modal === 'add-demo'}
                onClose={closeModal}
                title="Tambah Perangkat"
            >
                <DeviceForm
                    device={demoDefaults}
                    onSubmit={handleStore}
                    onCancel={closeModal}
                    processing={false}
                />
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal
                open={modal === 'edit'}
                onClose={closeModal}
                title="Edit Perangkat"
            >
                <DeviceForm
                    device={device}
                    onSubmit={handleUpdate}
                    onCancel={closeModal}
                    processing={false}
                />
            </Modal>
        </AppLayout>
    );
}
