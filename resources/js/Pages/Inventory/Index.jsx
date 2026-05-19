import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Server, Cpu, HardDrive, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const b = Number(bytes);
    if (b >= 1_099_511_627_776) return (b / 1_099_511_627_776).toFixed(1) + ' TB';
    if (b >= 1_073_741_824)     return (b / 1_073_741_824).toFixed(1) + ' GB';
    if (b >= 1_048_576)         return (b / 1_048_576).toFixed(1) + ' MB';
    if (b >= 1_024)             return (b / 1_024).toFixed(1) + ' KB';
    return b + ' B';
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-400 min-w-[160px]">{label}</span>
            <span className="text-sm font-medium text-slate-700 text-right break-all">{value ?? '—'}</span>
        </div>
    );
}

export default function InventoryIndex({ device, system_info, interfaces }) {
    const info = system_info ?? {};

    const upInterfaces  = interfaces.filter(i => i.oper_status === 'up');
    const downInterfaces = interfaces.filter(i => i.oper_status !== 'up');

    const totalErrors   = interfaces.reduce((s, i) => s + (i.in_errors  || 0) + (i.out_errors  || 0), 0);
    const totalDiscards = interfaces.reduce((s, i) => s + (i.in_discards || 0) + (i.out_discards || 0), 0);

    return (
        <AppLayout title="Inventory Perangkat">
            <Head title="Inventory" />

            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Inventory Perangkat</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    Configuration Management (C) — FCAPS
                </p>
            </div>

            {!device ? (
                <div className="chart-card py-16 text-center">
                    <Server size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">Belum ada perangkat terkonfigurasi</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                                <Wifi size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Interface Up</div>
                                <div className="text-xl font-bold text-emerald-600">{upInterfaces.length}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-400 flex items-center justify-center">
                                <WifiOff size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Interface Down</div>
                                <div className="text-xl font-bold text-red-500">{downInterfaces.length}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalErrors > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                <AlertTriangle size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Total Errors</div>
                                <div className={`text-xl font-bold ${totalErrors > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{totalErrors.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalDiscards > 0 ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                <AlertTriangle size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Total Discards</div>
                                <div className={`text-xl font-bold ${totalDiscards > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{totalDiscards.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* Device Info */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Server size={16} className="text-sky-500" />
                                <h3 className="font-bold text-slate-700">Informasi Perangkat</h3>
                            </div>
                            <div className="px-5 py-2">
                                <InfoRow label="Nama"          value={device.name} />
                                <InfoRow label="IP Address"    value={device.ip_address} />
                                <InfoRow label="SNMP Version"  value={`v${device.snmp_version}`} />
                                <InfoRow label="SNMP Community" value={device.snmp_community} />
                                <InfoRow label="Lokasi"        value={device.location} />
                                <InfoRow label="Status"        value={device.status} />
                                <InfoRow label="Last Polled"   value={device.last_polled_at} />
                            </div>
                        </div>

                        {/* System Info dari SNMP */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Cpu size={16} className="text-violet-500" />
                                <h3 className="font-bold text-slate-700">System Info (SNMP)</h3>
                            </div>
                            <div className="px-5 py-2">
                                <InfoRow label="sysName"    value={info.sys_name} />
                                <InfoRow label="sysDescr"   value={info.sys_descr} />
                                <InfoRow label="sysContact" value={info.sys_contact} />
                                <InfoRow label="sysLocation"value={info.sys_location} />
                                <InfoRow label="Uptime"     value={info.uptime_formatted} />
                                <InfoRow label="RouterOS"   value={info.routeros_version} />
                                <InfoRow label="Board"      value={info.board_name} />
                            </div>
                        </div>
                    </div>

                    {/* Interface Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HardDrive size={16} className="text-emerald-500" />
                                <h3 className="font-bold text-slate-700">Semua Interface</h3>
                            </div>
                            <span className="text-xs text-slate-400">{interfaces.length} interface</span>
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
                                        <th>Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interfaces.map((iface) => {
                                        const hasError    = (iface.in_errors + iface.out_errors) > 0;
                                        const hasDiscards = (iface.in_discards + iface.out_discards) > 0;
                                        return (
                                            <tr key={iface.id} className={hasError ? 'bg-red-50/30' : ''}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${iface.oper_status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                        <span className="font-semibold text-sky-700">{iface.name}</span>
                                                    </div>
                                                    {iface.desc && iface.desc !== iface.name && (
                                                        <div className="text-xs text-slate-400 ml-4">{iface.desc}</div>
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
                                                    {hasError ? `${iface.in_errors.toLocaleString()} / ${iface.out_errors.toLocaleString()}` : '0 / 0'}
                                                </td>
                                                <td className={`text-sm font-medium ${hasDiscards ? 'text-orange-600' : 'text-slate-300'}`}>
                                                    {hasDiscards ? `${iface.in_discards.toLocaleString()} / ${iface.out_discards.toLocaleString()}` : '0 / 0'}
                                                </td>
                                                <td className="text-xs text-slate-400">{iface.last_updated}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {interfaces.length === 0 && (
                            <div className="py-12 text-center text-slate-400">
                                <p className="text-sm">Belum ada data interface</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    );
}
