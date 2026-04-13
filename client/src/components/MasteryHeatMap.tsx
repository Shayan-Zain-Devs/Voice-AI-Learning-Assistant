import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
    BarChart3, TrendingUp, Brain, Zap, AlertCircle, Loader2, 
    History, Target, Gauge, ShieldCheck, BookOpen 
} from 'lucide-react';

export default function MasteryHeatMap() {
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            try {
                // 1. Get current library topics for filtering
                const { data: books } = await supabase.from('textbooks').select('id');
                const bookIds = books?.map(b => b.id) || [];
                const { data: schedules } = await supabase.from('daily_schedules').select('passing_criteria').in('textbook_id', bookIds);
                const currentTopics = new Set(schedules?.flatMap(s => s.passing_criteria) || []);

                // 2. Fetch Analytics (Mastery View)
                const { data: stats } = await supabase.from('student_analytics').select('*').eq('user_id', user.id).order('mastery_score', { ascending: false });
                
                // 3. Fetch Recent Activity (Raw Study Logs)
                const { data: logs } = await supabase.from('study_logs').select('*, daily_schedules(textbook_id)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);

                if (stats) {
                    setAnalytics(stats.filter(item => currentTopics.has(item.topic)));
                }
                if (logs) {
                    setRecentLogs(logs.filter(l => bookIds.includes(l.daily_schedules?.textbook_id)));
                }

            } catch (err) {
                console.error("Data Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <Loader2 className="animate-spin text-accent-lime" size={48} />
                <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-lime/50" size={20} />
            </div>
            <p className="text-slate-500 font-mono font-bold uppercase text-[10px] tracking-[0.3em] animate-pulse">Computing Mastery Metrics...</p>
        </div>
    );

    const masteredCount = analytics.filter(a => a.mastery_score >= 80).length;
    const criticalCount = analytics.filter(a => a.mastery_score < 50).length;
    const avgScore = analytics.length > 0 ? Math.round(analytics.reduce((acc, curr) => acc + curr.mastery_score, 0) / analytics.length) : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-10">
            
            {/* --- SECTION 1: EXECUTIVE KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-card border border-border-color p-6 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={40} /></div>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Mastery</p>
                    <p className="text-4xl font-black text-accent-lime">{masteredCount}<span className="text-slate-700 text-lg ml-1">/{analytics.length}</span></p>
                </div>

                <div className="bg-bg-card border border-border-color p-6 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Gauge size={40} /></div>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Avg Accuracy</p>
                    <p className="text-4xl font-black text-accent-lime">{avgScore}%</p>
                </div>

                <div className="bg-bg-card border border-border-color p-6 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle size={40} /></div>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Critical Areas</p>
                    <p className={`text-4xl font-black ${criticalCount > 0 ? 'text-red-500' : 'text-accent-lime'}`}>{criticalCount}</p>
                </div>

                <div className="bg-bg-card border border-border-color p-6 rounded-[2rem] flex flex-col justify-center items-center gap-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-accent-lime animate-pulse" size={20} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">MCP Secured</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-lime w-full shadow-[0_0_10px_#bef264]"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- SECTION 2: KNOWLEDGE MOSAIC (Left 8 Columns) --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-bg-card border border-border-color rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border-color flex items-center justify-between bg-white/[0.01]">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                    <Brain className="text-accent-lime" size={20} />
                                    Knowledge Mosaic
                                </h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Cognitive performance mapping</p>
                            </div>
                            <BarChart3 className="text-slate-800" />
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analytics.map((item) => (
                                <div key={item.topic} className="bg-white/[0.02] border border-border-color p-5 rounded-2xl hover:border-accent-lime/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="max-w-[70%]">
                                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-tight whitespace-normal leading-tight group-hover:text-white">{item.topic}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                                                item.mastery_status === 'Mastered' ? 'bg-accent-lime/10 text-accent-lime' :
                                                item.mastery_status === 'Learning' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
                                            }`}>{item.mastery_status}</span>
                                        </div>
                                        <span className="text-xl font-mono font-black text-slate-700 group-hover:text-accent-lime/40 transition-colors">{item.mastery_score}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${item.mastery_score >= 80 ? 'bg-accent-lime' : item.mastery_score >= 50 ? 'bg-blue-400' : 'bg-red-500'}`} style={{ width: `${item.mastery_score}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- SECTION 3: RECENT SESSIONS & DISTRIBUTION (Right 4 Columns) --- */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Mastery Distribution Chart */}
                    <div className="bg-bg-card border border-border-color p-8 rounded-[2.5rem]">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp size={14} className="text-accent-lime" />
                            Score Spread
                        </h3>
                        <div className="flex items-end justify-around h-32 gap-2 px-2">
                            {[
                                { label: '0-50', count: analytics.filter(a => a.mastery_score < 50).length, color: 'bg-red-500' },
                                { label: '50-80', count: analytics.filter(a => a.mastery_score >= 50 && a.mastery_score < 80).length, color: 'bg-blue-400' },
                                { label: '80-100', count: analytics.filter(a => a.mastery_score >= 80).length, color: 'bg-accent-lime' }
                            ].map((bar) => (
                                <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div 
                                        className={`w-full ${bar.color} rounded-t-lg transition-all duration-1000 origin-bottom hover:brightness-125`}
                                        style={{ height: `${(bar.count / (analytics.length || 1)) * 100}%`, minHeight: bar.count > 0 ? '4px' : '0px' }}
                                    ></div>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{bar.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-bg-card border border-border-color rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 border-b border-border-color bg-white/[0.01]">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <History size={14} className="text-accent-lime" />
                                Live Session Feed
                            </h3>
                        </div>
                        <div className="p-2">
                            {recentLogs.length === 0 ? (
                                <p className="text-slate-600 text-[10px] p-10 text-center italic">Waiting for incoming MCP data...</p>
                            ) : (
                                recentLogs.map((log, i) => (
                                    <div key={log.id} className={`p-4 flex items-center gap-4 hover:bg-white/[0.02] rounded-2xl transition-colors ${i !== recentLogs.length-1 ? 'border-b border-white/5' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${log.score >= 80 ? 'border-accent-lime/30 text-accent-lime' : 'border-red-500/30 text-red-500'}`}>
                                            <Zap size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-200 truncate uppercase tracking-tighter">{log.topic}</p>
                                            <p className="text-[9px] text-slate-500 font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.score}% Accuracy</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* --- FOOTER SYNC STATUS --- */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-6 px-8 py-3 bg-bg-card border border-border-color rounded-full shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-lime shadow-[0_0_8px_#bef264]"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End ADBMS Sync</span>
                    </div>
                    <div className="w-px h-3 bg-border-color"></div>
                    <div className="flex items-center gap-2">
                        <BookOpen size={12} className="text-slate-600" />
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Real-time Analytics Enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}