import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, NetworkIcon, Lock, Mail, LogIn, Loader2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title="Login — NetMonitor" />

            <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* ── Left Panel: Branding ── */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
                    style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #38bdf8 100%)' }}>

                    {/* Background decorative circles */}
                    <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-10"
                        style={{ background: 'rgba(255,255,255,0.4)' }} />
                    <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10"
                        style={{ background: 'rgba(255,255,255,0.3)' }} />
                    <div className="absolute top-1/3 right-[-40px] w-48 h-48 rounded-full opacity-10"
                        style={{ background: 'rgba(255,255,255,0.2)' }} />

                    {/* Content */}
                    <div className="relative z-10 text-center text-white">
                        {/* Logo */}
                        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                            <NetworkIcon size={40} className="text-white" />
                        </div>

                        <h1 className="text-4xl font-black tracking-tight mb-2">NetMonitor</h1>
                        <p className="text-lg font-medium opacity-80 mb-10">SNMP Network Analyzer</p>

                        {/* Feature list */}
                        <div className="space-y-4 text-left max-w-xs mx-auto">
                            {[
                                { icon: '📊', text: 'Dashboard monitoring real-time' },
                                { icon: '📡', text: 'Polling SNMP otomatis setiap menit' },
                                { icon: '📈', text: 'Grafik trafik & kinerja perangkat' },
                                { icon: '🔔', text: 'Sistem alert & threshold otomatis' },
                                { icon: '🎭', text: 'Mode Demo tanpa perangkat fisik' },
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                                    <span className="text-sm font-medium opacity-90">{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right Panel: Login Form ── */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
                    <div className="w-full max-w-md">

                        {/* Mobile logo (only on small screens) */}
                        <div className="flex items-center gap-3 mb-8 lg:hidden">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #0369a1, #0ea5e9)' }}>
                                <NetworkIcon size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-base font-bold text-slate-800">NetMonitor</div>
                                <div className="text-xs text-slate-400">SNMP Analyzer</div>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800">Selamat Datang 👋</h2>
                            <p className="text-slate-500 text-sm mt-1.5">Masuk ke sistem monitoring jaringan Anda</p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
                                {status}
                            </div>
                        )}

                        {/* Form card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

                            <form onSubmit={submit} className="space-y-5">

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Mail size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            placeholder="admin@example.com"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white
                                                placeholder-slate-400 text-slate-800 transition-all duration-200
                                                focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                                                ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Lock size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            autoComplete="current-password"
                                            required
                                            placeholder="••••••••"
                                            className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm bg-white
                                                placeholder-slate-400 text-slate-800 transition-all duration-200
                                                focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                                                ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                                            onClick={() => setShowPassword(v => !v)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password}</p>
                                    )}
                                </div>

                                {/* Remember me + Forgot password */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                checked={data.remember}
                                                onChange={e => setData('remember', e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-9 h-5 rounded-full transition-colors ${data.remember ? 'bg-sky-600' : 'bg-slate-300'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${data.remember ? 'translate-x-4.5' : 'translate-x-0.5'}`}
                                                    style={{ transform: data.remember ? 'translateX(18px)' : 'translateX(2px)' }} />
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">Ingat saya</span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                                        >
                                            Lupa password?
                                        </Link>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    id="login-submit"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                                        text-sm font-bold text-white transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
                                        disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{ background: processing ? '#94a3b8' : 'linear-gradient(135deg, #0369a1, #0ea5e9)' }}
                                >
                                    {processing
                                        ? <><Loader2 size={16} className="animate-spin" /> Masuk...</>
                                        : <><LogIn size={16} /> Masuk ke Dashboard</>
                                    }
                                </button>
                            </form>
                        </div>

                        {/* Default credentials hint */}
                        <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500">
                            <span className="font-semibold text-slate-600">Default login:</span>{' '}
                            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">admin@mikrotik.com</code>
                            {' '}/{' '}
                            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">password</code>
                        </div>

                        <p className="text-center text-xs text-slate-400 mt-6">
                            © {new Date().getFullYear()} NetMonitor SNMP Analyzer
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
