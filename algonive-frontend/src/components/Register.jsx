import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Shield, CheckCircle2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register({ onSwitchView }) {
    const { register } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('member');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password, role);
            setSuccess(true);
            setTimeout(() => onSwitchView(), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative z-10 py-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 mb-4">
                        <Activity className="text-emerald-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Create Profile</h2>
                    <p className="text-slate-400 mt-2 text-sm">Join the team workspace</p>
                </div>

                {success && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center gap-3 text-sm border border-emerald-500/20">
                        <CheckCircle2 size={18} />
                        <span>Profile created! Initiating redirect...</span>
                    </motion.div>
                )}

                {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm border border-rose-500/20">
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Designation</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <User size={18} />
                            </span>
                            <input 
                                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <Mail size={18} />
                            </span>
                            <input 
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Security Key</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <Lock size={18} />
                            </span>
                            <input 
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Access Level</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                <Shield size={18} />
                            </span>
                            <select 
                                value={role} onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="member">Standard Operative</option>
                                <option value="manager">Project Manager</option>
                                <option value="admin">System Administrator</option>
                            </select>
                        </div>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20 mt-4"
                    >
                        Establish Profile
                    </motion.button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-8">
                    Already authorized?{' '}
                    <button onClick={onSwitchView} className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors focus:outline-none hover:underline underline-offset-4">
                        Initialize login
                    </button>
                </p>
            </motion.div>
        </div>
    );
}