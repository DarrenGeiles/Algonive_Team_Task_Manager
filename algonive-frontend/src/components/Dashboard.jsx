import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, CheckCircle, Clock, AlertTriangle, Plus, Activity, Search, Sun, Moon, Calendar, User, Bell, ChevronRight, X, CheckSquare, History, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const { user, token, logout } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // UI Panels Controls
    const [showModal, setShowModal] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    
    // 🚀 NEW STATE FEATURE: Scoped User View Filter Node
    const [selectedUserFilter, setSelectedUserFilter] = useState('');
    
    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('pending');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [subtasksText, setSubtasksText] = useState('');

    const notifRef = useRef(null);
    const drawerRef = useRef(null);
    const todayString = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifs(false);
            if (drawerRef.current && !drawerRef.current.contains(event.target) && !event.target.closest('.history-toggle-btn')) setShowDrawer(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tasks/logs', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok) setLogs(data);
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        try {
            const taskRes = await fetch('http://localhost:5000/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
            const taskData = await taskRes.json();
            
            if (user.role === 'admin' || user.role === 'manager') setTasks(taskData);
            else setTasks(taskData.filter(t => t.assigned_to === user.id));

            const upcoming = taskData.filter(t => 
                (user.role === 'admin' || t.assigned_to === user.id) && 
                t.status !== 'completed' && 
                ((t.due_date && new Date(t.due_date) - new Date() < 172800000) || t.status === 'pending')
            );
            
            if (upcoming.length > notifications.length) setHasUnread(true);
            setNotifications(upcoming);

            const userRes = await fetch('http://localhost:5000/api/auth/users');
            const userData = await userRes.json();
            
            // Populate dropdown metrics using strict backend database constraints
            if (user.role === 'admin') setTeamUsers(userData);
            else if (user.role === 'manager') setTeamUsers(userData.filter(u => u.role !== 'admin'));
            else setTeamUsers(userData.filter(u => u.id === user.id));

            fetchLogs();
        } catch (err) { console.error('Error fetching:', err); }
    };

    useEffect(() => { fetchData(); }, [user]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const finalAssigneeId = user.role === 'member' ? user.id : (assignedTo || user.id);
            const response = await fetch('http://localhost:5000/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, description, priority, status, assigned_to: finalAssigneeId, due_date: dueDate || null, subtasks: subtasksText })
            });
            if (response.ok) {
                setTitle(''); setDescription(''); setDueDate(''); setAssignedTo(''); setSubtasksText(''); setPriority('medium'); setShowModal(false);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (taskId, newStatus) => {
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const toggleSubtask = async (taskId, subtaskId, completed) => {
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/subtask`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ subtaskId, completed })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you certain you want to permanently clear this workspace entry node?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) fetchData();
        } catch (err) { console.error(err); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No Deadline';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // 🚀 NEW PIPELINE LOGIC: Dual-Stack Selection Filter and Keyword Text Engine
    const displayedTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesUserFilter = selectedUserFilter === '' ? true : t.assigned_to === Number(selectedUserFilter);
        
        return matchesSearch && matchesUserFilter;
    });

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen overflow-hidden flex flex-col">
            <nav className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-6 py-4 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20 dark:border-blue-500/30">
                        <Activity className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">Nexus Workspace</span>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* 🚀 NEW UI CONTROL: Scoped Dynamic Category Dropdown Element */}
                    {(user.role === 'admin' || user.role === 'manager') && (
                        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3.5 py-1.5 transition-all">
                            <Filter size={14} className="text-slate-500 dark:text-slate-400 mr-2" />
                            <select 
                                value={selectedUserFilter} 
                                onChange={(e) => setSelectedUserFilter(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-900 pr-1"
                            >
                                <option value="">Show All Workflows</option>
                                {teamUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.id === user.id ? "Assigned to Me" : `${u.name} (${u.role})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="hidden md:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 focus-within:ring-2 ring-blue-500/50 transition-all">
                        <Search size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
                        <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48 text-slate-800 dark:text-white placeholder:text-slate-500" />
                    </div>

                    <button onClick={() => { setShowDrawer(true); fetchLogs(); }} className="history-toggle-btn p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <History size={20} />
                    </button>

                    <div className="relative" ref={notifRef}>
                        <button onClick={() => { setShowNotifs(!showNotifs); setHasUnread(false); }} className="p-2 rounded-full relative text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <Bell size={20} />
                            {hasUnread && (
                                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                </span>
                            )}
                        </button>
                        <AnimatePresence>
                            {showNotifs && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                    <div className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-white/10 px-4 py-3 flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Action Items</h4>
                                        <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded-full">{notifications.length} New</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="p-4 text-center text-sm text-slate-500">No urgent notifications.</p>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className="p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1 line-clamp-1">{n.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(n.due_date) < new Date() ? <span className="text-rose-500 font-medium">Deadline approaching/passed</span> : "New task pending action"}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="flex items-center gap-4 pl-4 sm:pl-6 border-l border-slate-300 dark:border-white/10">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 capitalize font-medium">{user?.role} Clearance</p>
                        </div>
                        <button onClick={logout} className="p-2 hover:bg-rose-500/10 rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 overflow-y-auto">
                {/* 🚀 Mobile-Only Category Selector Layout Node */}
                {(user.role === 'admin' || user.role === 'manager') && (
                    <div className="sm:hidden mb-6 flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
                        <Filter size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
                        <select 
                            value={selectedUserFilter} 
                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                        >
                            <option value="">Show All Workflows</option>
                            {teamUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.id === user.id ? "Assigned to Me" : `${u.name} (${u.role})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pending Action</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{displayedTasks.filter(t => t.status === 'pending').length}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><Clock size={28} /></div>
                    </div>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">In Progress</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{displayedTasks.filter(t => t.status === 'in progress').length}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><AlertTriangle size={28} /></div>
                    </div>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Completed</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{displayedTasks.filter(t => t.status === 'completed').length}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle size={28} /></div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50 tracking-wide mb-1 drop-shadow-md">
                            {user.role === 'admin' ? "Global Organization Tasks" : user.role === 'manager' ? "Team Sprint Overview" : "My Assignments"}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-200 text-sm font-medium">Track progress and update workflows.</p>
                    </div>
                    
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all">
                        <Plus size={20} /> {user.role === 'member' ? "Log Personal Task" : "Assign Task"}
                    </motion.button>
                </div>

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedTasks.map((task) => {
                        let parsedSubtasks = [];
                        try { parsedSubtasks = typeof task.subtasks === 'string' ? JSON.parse(task.subtasks) : (task.subtasks || []); } catch(e) {}
                        
                        const totalSubtasks = parsedSubtasks.length;
                        const completedSubtasks = parsedSubtasks.filter(st => st.completed).length;
                        const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);
                        
                        const isAssignee = user.id === task.assigned_to;
                        const canModifySubtasks = isAssignee && task.status === 'in progress';

                        const canDelete = user.role === 'admin' || 
                            (user.role === 'manager' && (isAssignee || task.assignee_role === 'member' || !task.assigned_to)) || 
                            (user.role === 'member' && isAssignee);

                        return (
                            <motion.div key={task.id} variants={itemVariants} layout className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl transition-colors flex flex-col h-full relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                                        {task.priority}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${task.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500/30 dark:text-emerald-400' : task.status === 'in progress' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-400' : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-400'}`}>
                                            {task.status.toUpperCase()}
                                        </span>
                                        {canDelete && (
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer"
                                                title="Purge Task Document"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h4 className="font-bold text-xl text-slate-800 dark:text-white mb-2 leading-tight">{task.title}</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">{task.description}</p>
                                
                                {totalSubtasks > 0 && (
                                    <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 flex-1">
                                        <div className="flex justify-between text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                                            <span>Progress</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-4">
                                            <div className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                        <div className="space-y-2">
                                            {parsedSubtasks.map(st => (
                                                <label key={st.id} className={`flex items-start gap-2 text-sm transition-opacity duration-200 ${!canModifySubtasks ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                    <input type="checkbox" checked={st.completed} disabled={!canModifySubtasks} onChange={(e) => toggleSubtask(task.id, st.id, e.target.checked)} className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40 transition-all cursor-pointer" />
                                                    <span className={`${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {task.status === 'pending' && isAssignee && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-3 animate-pulse">⚠️ Click "Start Work" below to open subtasks checklist.</p>
                                        )}
                                    </div>
                                )}

                                <div className={`${totalSubtasks === 0 ? 'mt-auto' : ''} bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-white/5`}>
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg"><User size={14} className="text-blue-600 dark:text-blue-400"/></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-white">{task.assignee_name || 'Unassigned'}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{task.assignee_role || 'Member'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                        <Calendar size={14} className={new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-rose-500' : ''}/>
                                        <span className={new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-rose-500 dark:text-rose-400 font-bold' : ''}>Due: {formatDate(task.due_date)}</span>
                                    </div>
                                </div>

                                {task.status !== 'completed' && isAssignee && (
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        {task.status === 'pending' && (
                                            <button onClick={() => updateStatus(task.id, 'in progress')} className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 transition-colors">Start Work <ChevronRight size={16}/></button>
                                        )}
                                        {task.status === 'in progress' && (
                                            <button onClick={() => updateStatus(task.id, 'completed')} className="col-span-2 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition-colors">Mark Completed <CheckCircle size={16}/></button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    {displayedTasks.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-500 dark:text-slate-400">
                            <div className="inline-block p-4 bg-slate-100 dark:bg-white/5 rounded-full mb-4"><Search size={40} className="opacity-50" /></div>
                            <p className="text-lg font-medium">No tasks found matching your filters.</p>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Slide-out System Audit Trail Drawer */}
            <AnimatePresence>
                {showDrawer && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)} className="absolute inset-0" />
                        
                        <motion.div ref={drawerRef} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.35 }} className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col p-6 overflow-hidden z-10 transition-colors">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                <div className="flex items-center gap-2">
                                    <History className="text-blue-500" size={22} />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Workspace Audit Trail</h3>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={22}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                                {logs.map((log, index) => (
                                    <div key={log.id || index} className="flex gap-4 relative group">
                                        {index !== logs.length - 1 && (
                                            <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                                        )}
                                        <div className="flex-none w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-400 capitalize">
                                            {log.user_name ? log.user_name.charAt(0) : 'U'}
                                        </div>
                                        <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-xl p-3.5 shadow-xs">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">{log.user_name || 'System Operative'}</h5>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 capitalize tracking-wide">{log.user_role} Clearance</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5 font-medium">{log.action_text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Task Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative my-8 transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Allocate New Task</h3>
                                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={24}/></button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtasks (separate with commas)</label>
                                    <div className="relative">
                                        <CheckSquare size={16} className="absolute top-3.5 left-3 text-slate-400" />
                                        <input type="text" value={subtasksText} onChange={(e) => setSubtasksText(e.target.value)} placeholder="e.g. Design mockups, Write API, Test" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 outline-none cursor-pointer bg-white dark:bg-slate-900">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                                        <input type="date" value={dueDate} min={todayString} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 outline-none cursor-pointer" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
                                        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} disabled={user.role === 'member'} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 outline-none cursor-pointer disabled:opacity-50 bg-white dark:bg-slate-900">
                                            {user.role === 'member' ? (
                                                <option value={user.id}>{user.name} (Self)</option>
                                            ) : (
                                                <>
                                                    <option value="">Select Member...</option>
                                                    {teamUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md transition-all">Deploy Task</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}