import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, Download, Cpu, MemoryStick, HardDrive, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-slate-600 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium">
                        {p.name}: {p.value}%
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function StatSummaryCard({ label, stats, color, icon: Icon }) {
    if (!stats) return (
        <div className="stat-card opacity-50">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={18} className="text-white" />
                </div>
                <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">{label}</div>
                    <div className="text-slate-300 text-sm mt-1">Belum ada data</div>
                </div>
            </div>
        </div>
    );

    const trend = stats.current > stats.avg
        ? <span className="flex items-center gap-0.5 text-red-500 text-xs"><TrendingUp size={12} />{(stats.current - stats.avg).toFixed(1)}%</span>
        : <span className="flex items-center gap-0.5 text-emerald-500 text-xs"><TrendingDown size={12} />{(stats.avg - stats.current).toFixed(1)}%</span>;

    return (
        <div className="stat-card">
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase">{label}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-slate-800">{stats.current}%</span>
                        {trend}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-400 font-medium">Min</div>
                    <div className="font-bold text-slate-700">{stats.min}%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-400 font-medium">Avg</div>
                    <div className="font-bold text-slate-700">{stats.avg}%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-400 font-medium">Max</div>
                    <div className="font-bold text-slate-700">{stats.max}%</div>
                </div>
            </div>
        </div>
    );
}

export default function ReportsIndex({
    device, period,
    cpu_stats, mem_stats, disk_stats,
    cpu_history, mem_history, disk_history,
}) {
    const periods = [
        { value: '1h',  label: '1 Jam' },
        { value: '6h',  label: '6 Jam' },
        { value: '24h', label: '24 Jam' },
        { value: '7d',  label: '7 Hari' },
    ];

    const setPeriod = (p) => {
        router.get('/reports', { period: p }, { preserveState: false });
    };

    const exportCSV = () => {
        window.location.href = `/reports/export?period=${period}`;
    };

    return (
        <AppLayout title="Laporan Kinerja">
            <Head title="Laporan" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Laporan & Analisis Kinerja</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {device ? `Perangkat: ${device.name}` : 'Belum ada perangkat'}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {/* Period buttons */}
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        {periods.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    period === p.value
                                        ? 'bg-white text-sky-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={exportCSV} className="btn-secondary text-xs py-2">
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {!device && (
                <div className="chart-card py-16 text-center">
                    <BarChart3 size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Tambahkan perangkat terlebih dahulu</p>
                </div>
            )}

            {device && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatSummaryCard label="CPU Load" stats={cpu_stats} color="bg-sky-600" icon={Cpu} />
                        <StatSummaryCard label="Memory Usage" stats={mem_stats} color="bg-violet-600" icon={MemoryStick} />
                        <StatSummaryCard label="Disk Usage" stats={disk_stats} color="bg-amber-500" icon={HardDrive} />
                    </div>

                    {/* CPU Chart */}
                    {cpu_history.length > 0 && (
                        <div className="chart-card mb-5">
                            <h3 className="section-title flex items-center gap-2 mb-4">
                                <Cpu size={16} className="text-sky-500" />
                                Tren CPU Load
                            </h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={cpu_history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="value" name="CPU" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Memory & Disk Charts side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {mem_history.length > 0 && (
                            <div className="chart-card">
                                <h3 className="section-title flex items-center gap-2 mb-4">
                                    <MemoryStick size={16} className="text-violet-500" />
                                    Tren Memory Usage
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={mem_history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Memory" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {disk_history.length > 0 && (
                            <div className="chart-card">
                                <h3 className="section-title flex items-center gap-2 mb-4">
                                    <HardDrive size={16} className="text-amber-500" />
                                    Tren Disk Usage
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={disk_history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="value" name="Disk" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {cpu_history.length === 0 && mem_history.length === 0 && disk_history.length === 0 && (
                        <div className="chart-card py-16 text-center">
                            <BarChart3 size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400">Belum ada data untuk periode yang dipilih</p>
                            <p className="text-xs text-slate-300 mt-1">Tunggu beberapa menit untuk data polling terkumpul</p>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
