import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Download, Upload, RefreshCw, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-slate-600 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium">
                        {p.name}: {p.value?.toFixed(4)} Mbps
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function StatBox({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={16} className="text-white" />
            </div>
            <div>
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className="text-base font-bold text-slate-800">{value !== null ? `${value?.toFixed(4)} Mbps` : '—'}</div>
            </div>
        </div>
    );
}

export default function TrafficIndex({ device, interfaces, traffic_data: initialData, selected_interface }) {
    const [selectedIface, setSelectedIface] = useState(selected_interface ?? '');
    const [hours, setHours] = useState(1);
    const [trafficData, setTrafficData] = useState(initialData ?? []);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchData = useCallback(async () => {
        if (!selectedIface) return;
        setLoading(true);
        try {
            const { data } = await axios.get('/api/traffic/data', {
                params: { interface: selectedIface, hours },
            });
            setTrafficData(data.data ?? []);
            setStats(data.stats ?? null);
            setLastUpdate(new Date());
        } catch (e) {}
        finally { setLoading(false); }
    }, [selectedIface, hours]);

    useEffect(() => {
        fetchData();
    }, [selectedIface, hours]);

    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [fetchData, autoRefresh]);

    const currentIn  = trafficData.length > 0 ? trafficData[trafficData.length - 1]?.in  : null;
    const currentOut = trafficData.length > 0 ? trafficData[trafficData.length - 1]?.out : null;

    return (
        <AppLayout title="Monitor Traffic">
            <Head title="Traffic Monitor" />

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">Monitor Traffic Real-Time</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Bandwidth Rx/Tx per interface</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Interface selector */}
                    <select
                        id="interface-select"
                        className="form-select w-auto text-sm py-2"
                        value={selectedIface}
                        onChange={e => setSelectedIface(e.target.value)}
                    >
                        <option value="">-- Pilih Interface --</option>
                        {interfaces.map(i => (
                            <option key={i.id} value={i.name}>
                                {i.name} ({i.desc}) {i.status === 'up' ? '✅' : '❌'}
                            </option>
                        ))}
                    </select>

                    {/* Period */}
                    <select
                        id="period-select"
                        className="form-select w-auto text-sm py-2"
                        value={hours}
                        onChange={e => setHours(Number(e.target.value))}
                    >
                        <option value={1}>1 Jam</option>
                        <option value={3}>3 Jam</option>
                        <option value={6}>6 Jam</option>
                        <option value={12}>12 Jam</option>
                        <option value={24}>24 Jam</option>
                    </select>

                    {/* Auto-refresh toggle */}
                    <button
                        id="auto-refresh-toggle"
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`btn-secondary text-xs py-2 ${autoRefresh ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : ''}`}
                    >
                        <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} />
                        {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                    </button>

                    <button id="refresh-btn" onClick={fetchData} disabled={loading} className="btn-secondary text-xs py-2">
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* No device */}
            {!device && (
                <div className="chart-card py-16 text-center">
                    <Activity size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Belum ada perangkat terkonfigurasi</p>
                </div>
            )}

            {device && (
                <>
                    {/* Current Traffic Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        <StatBox icon={Download} label="Download (Current)" value={currentIn} color="bg-emerald-500" />
                        <StatBox icon={Upload} label="Upload (Current)" value={currentOut} color="bg-amber-500" />
                        <StatBox icon={TrendingUp} label="Download (Max)" value={stats?.in_max} color="bg-sky-500" />
                        <StatBox icon={TrendingDown} label="Upload (Max)" value={stats?.out_max} color="bg-violet-500" />
                    </div>

                    {/* Stats Table */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                                    <span className="text-xs font-bold text-emerald-700 uppercase">📥 Download (Rx)</span>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {[
                                            ['Current', stats.in_current?.toFixed(4)],
                                            ['Average', stats.in_avg?.toFixed(4)],
                                            ['Maximum', stats.in_max?.toFixed(4)],
                                            ['Minimum', stats.in_min?.toFixed(4)],
                                        ].map(([k, v]) => (
                                            <tr key={k} className="border-b border-slate-50">
                                                <td className="px-4 py-2 text-slate-400">{k}</td>
                                                <td className="px-4 py-2 font-semibold text-slate-700 text-right">{v} Mbps</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                                    <span className="text-xs font-bold text-amber-700 uppercase">📤 Upload (Tx)</span>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {[
                                            ['Current', stats.out_current?.toFixed(4)],
                                            ['Average', stats.out_avg?.toFixed(4)],
                                            ['Maximum', stats.out_max?.toFixed(4)],
                                            ['Minimum', stats.out_min?.toFixed(4)],
                                        ].map(([k, v]) => (
                                            <tr key={k} className="border-b border-slate-50">
                                                <td className="px-4 py-2 text-slate-400">{k}</td>
                                                <td className="px-4 py-2 font-semibold text-slate-700 text-right">{v} Mbps</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Main Traffic Chart */}
                    <div className="chart-card">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="section-title flex items-center gap-2">
                                    <Activity size={16} className="text-emerald-500" />
                                    Grafik Traffic
                                    {selectedIface && <span className="text-sm font-normal text-slate-400">— {selectedIface}</span>}
                                </h3>
                                <p className="section-subtitle">
                                    Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                                </p>
                            </div>
                        </div>

                        {!selectedIface ? (
                            <div className="h-80 flex items-center justify-center text-slate-300">
                                <div className="text-center">
                                    <Activity size={40} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Pilih interface untuk melihat grafik</p>
                                </div>
                            </div>
                        ) : trafficData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center text-slate-300">
                                <div className="text-center">
                                    <Activity size={40} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Belum ada data traffic</p>
                                    <p className="text-xs mt-1">Menunggu polling SNMP berikutnya...</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={trafficData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                                    <defs>
                                        <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        tickFormatter={v => `${v}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="in"
                                        name="Download (↓)"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fill="url(#rxGrad)"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="out"
                                        name="Upload (↑)"
                                        stroke="#f59e0b"
                                        strokeWidth={2.5}
                                        fill="url(#txGrad)"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Interface List */}
                    {interfaces.length > 0 && (
                        <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="section-title">Semua Interface</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full data-table">
                                    <thead>
                                        <tr>
                                            <th>Interface</th>
                                            <th>Description</th>
                                            <th>Speed</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interfaces.map((iface) => (
                                            <tr key={iface.id}>
                                                <td className="font-semibold text-sky-600">{iface.name}</td>
                                                <td className="text-slate-500">{iface.desc}</td>
                                                <td>{iface.speed}</td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${iface.status === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {iface.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => setSelectedIface(iface.name)}
                                                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${selectedIface === iface.name ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600'}`}
                                                    >
                                                        {selectedIface === iface.name ? 'Aktif' : 'Monitor'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
