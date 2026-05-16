import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    Cpu, MemoryStick, HardDrive, Thermometer, Clock, Wifi, WifiOff,
    Bell, Activity, TrendingUp, RefreshCw, AlertTriangle
} from 'lucide-react';

// Circular Gauge Component
function CircularGauge({ value, max = 100, label, color = '#0ea5e9', unit = '%' }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const offset = circumference - (pct / 100) * circumference;

    const getColor = () => {
        if (pct >= 90) return '#ef4444';
        if (pct >= 70) return '#f59e0b';
        return color;
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                    />
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-800">
                        {value !== null && value !== undefined ? `${value}${unit === '%' ? '%' : ''}` : '—'}
                    </span>
                </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
    );
}

// Stat Card
function StatCard({ icon: Icon, label, value, unit, color = 'sky', subtext, pulse = false }) {
    const colorMap = {
        sky:     { bg: 'bg-sky-50',     icon: 'bg-sky-600',     text: 'text-sky-600' },
        emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-600' },
        amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-600' },
        red:     { bg: 'bg-red-50',     icon: 'bg-red-500',     text: 'text-red-600' },
        violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-600',  text: 'text-violet-600' },
    };
    const c = colorMap[color] ?? colorMap.sky;

    return (
        <div className="stat-card">
            <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
                        {pulse && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-2xl font-bold text-slate-800">
                        {value !== null && value !== undefined ? (
                            <>{value}<span className="text-sm font-medium text-slate-400 ml-1">{unit}</span></>
                        ) : (
                            <span className="text-slate-300 text-lg">—</span>
                        )}
                    </p>
                    {subtext && <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>}
                </div>
            </div>
        </div>
    );
}

// Tooltip custom
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-slate-600 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium">
                        {p.name}: {p.value}{p.unit ?? ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard({
    device, current, interfaces_up, interfaces_down, active_alerts,
    cpu_history: initialCpuHistory,
    memory_history: initialMemHistory,
    traffic_history: initialTrafficHistory,
    top_interface,
}) {
    const [liveData, setLiveData] = useState(current);
    const [cpuHistory, setCpuHistory] = useState(initialCpuHistory ?? []);
    const [memHistory, setMemHistory] = useState(initialMemHistory ?? []);
    const [trafficHistory] = useState(initialTrafficHistory ?? []);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [alertCount, setAlertCount] = useState(active_alerts ?? 0);

    const fetchLive = useCallback(async () => {
        try {
            setRefreshing(true);
            const { data } = await axios.get('/api/dashboard/live');

            setLiveData({
                cpu:              data.cpu,
                memory_percent:   data.memory_percent,
                memory_used_mb:   data.memory_used_mb,
                memory_total_mb:  data.memory_total_mb,
                disk_percent:     data.disk_percent,
                temperature:      data.temperature,
                uptime:           data.uptime,
            });

            setAlertCount(data.active_alerts ?? 0);
            setLastRefresh(new Date());

            if (data.cpu_point) {
                setCpuHistory(prev => {
                    const next = [...prev, data.cpu_point].slice(-60);
                    return next;
                });
            }
            if (data.memory_point) {
                setMemHistory(prev => {
                    const next = [...prev, data.memory_point].slice(-60);
                    return next;
                });
            }
        } catch (e) {
            // silent
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchLive, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [fetchLive]);

    const statusBadge = () => {
        if (!device) return null;
        if (device.status === 'online') return (
            <span className="badge-online">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online
            </span>
        );
        if (device.status === 'offline') return (
            <span className="badge-offline">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
                Offline
            </span>
        );
        return <span className="badge-unknown">Unknown</span>;
    };

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* No Device Notice */}
            {!device && (
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800">Belum ada perangkat terkonfigurasi</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Silakan <a href="/devices" className="underline font-medium">tambahkan perangkat MikroTik</a> untuk memulai monitoring.
                        </p>
                    </div>
                </div>
            )}

            {/* Device Header */}
            {device && (
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Wifi size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-base font-bold text-slate-800">{device.name}</h2>
                            {statusBadge()}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span>📍 {device.ip_address}</span>
                            {device.location && <span>🗺 {device.location}</span>}
                            {device.system_info?.sys_name && <span>🖥 {device.system_info.sys_name}</span>}
                            <span>⏱ Uptime: {liveData?.uptime ?? device.uptime_formatted}</span>
                        </div>
                        {device.system_info?.sys_descr && (
                            <p className="mt-1 text-xs text-slate-400 truncate">{device.system_info.sys_descr}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={fetchLive}
                            disabled={refreshing}
                            className="btn-secondary text-xs py-2"
                        >
                            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <span className="text-xs text-slate-400">
                            {lastRefresh.toLocaleTimeString('id-ID')}
                        </span>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={Cpu}
                    label="CPU Load"
                    value={liveData?.cpu}
                    unit="%"
                    color="sky"
                    pulse={!!device}
                />
                <StatCard
                    icon={MemoryStick}
                    label="Memori"
                    value={liveData?.memory_percent}
                    unit="%"
                    color="violet"
                    subtext={liveData?.memory_used_mb ? `${liveData.memory_used_mb} / ${liveData.memory_total_mb} MB` : null}
                    pulse={!!device}
                />
                <StatCard
                    icon={HardDrive}
                    label="Storage"
                    value={liveData?.disk_percent}
                    unit="%"
                    color="amber"
                    pulse={!!device}
                />
                <StatCard
                    icon={Thermometer}
                    label="Suhu"
                    value={liveData?.temperature}
                    unit="°C"
                    color={liveData?.temperature > 70 ? 'red' : 'emerald'}
                    pulse={!!device}
                />
            </div>

            {/* Second Row: Interface Status + Alert */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={Wifi}
                    label="Interface UP"
                    value={interfaces_up}
                    unit=""
                    color="emerald"
                />
                <StatCard
                    icon={WifiOff}
                    label="Interface DOWN"
                    value={interfaces_down}
                    unit=""
                    color={interfaces_down > 0 ? 'red' : 'sky'}
                />
                <StatCard
                    icon={Bell}
                    label="Alert Aktif"
                    value={alertCount}
                    unit=""
                    color={alertCount > 0 ? 'red' : 'emerald'}
                />
                <StatCard
                    icon={Clock}
                    label="Uptime"
                    value={liveData?.uptime ?? device?.uptime_formatted}
                    unit=""
                    color="sky"
                />
            </div>

            {/* Gauge Row */}
            {device && (
                <div className="mb-6 chart-card">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="section-title">Resource Monitor</h3>
                            <p className="section-subtitle">Status sumber daya saat ini</p>
                        </div>
                    </div>
                    <div className="flex justify-around flex-wrap gap-6">
                        <CircularGauge value={liveData?.cpu} label="CPU Load" color="#0ea5e9" />
                        <CircularGauge value={liveData?.memory_percent} label="Memory" color="#8b5cf6" />
                        <CircularGauge value={liveData?.disk_percent} label="Storage" color="#f59e0b" />
                        {liveData?.temperature && (
                            <CircularGauge
                                value={liveData.temperature}
                                max={100}
                                label="Suhu"
                                color="#10b981"
                                unit="°C"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* CPU Chart */}
                <div className="chart-card">
                    <div className="mb-4">
                        <h3 className="section-title flex items-center gap-2">
                            <Cpu size={16} className="text-sky-500" />
                            CPU Load History
                        </h3>
                        <p className="section-subtitle">2 jam terakhir</p>
                    </div>
                    {cpuHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={cpuHistory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="CPU"
                                    stroke="#0ea5e9"
                                    strokeWidth={2}
                                    fill="url(#cpuGrad)"
                                    unit="%"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-300">
                            <div className="text-center">
                                <Activity size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Menunggu data polling...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Memory Chart */}
                <div className="chart-card">
                    <div className="mb-4">
                        <h3 className="section-title flex items-center gap-2">
                            <MemoryStick size={16} className="text-violet-500" />
                            Memory Usage History
                        </h3>
                        <p className="section-subtitle">2 jam terakhir</p>
                    </div>
                    {memHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={memHistory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Memory"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#memGrad)"
                                    unit="%"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-300">
                            <div className="text-center">
                                <Activity size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Menunggu data polling...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Traffic Chart */}
            {trafficHistory.length > 0 && (
                <div className="chart-card mb-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="section-title flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-500" />
                                Traffic Monitor
                            </h3>
                            <p className="section-subtitle">Interface: {top_interface} — 1 jam terakhir</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trafficHistory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="in" name="Download (↓)" stroke="#10b981" strokeWidth={2} fill="url(#inGrad)" unit=" Mbps" dot={false} />
                            <Area type="monotone" dataKey="out" name="Upload (↑)" stroke="#f59e0b" strokeWidth={2} fill="url(#outGrad)" unit=" Mbps" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Footer info */}
            <div className="text-center text-xs text-slate-400">
                Auto-refresh setiap 30 detik • Polling SNMP setiap 1 menit via scheduler
            </div>
        </AppLayout>
    );
}
