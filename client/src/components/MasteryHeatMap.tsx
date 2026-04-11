import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function MasteryHeatMap() {
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We query the VIEW Zain built
            const { data, error } = await supabase
                .from('student_analytics')
                .select('*')
                .eq('user_id', user.id)
                .order('mastery_score', { ascending: false });

            if (data) setAnalytics(data);
            setLoading(false);
        }
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-600">Calculating Mastery...</div>;

    return (
        <div className="bg-bg-card border border-border-color p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Topic Mastery</h2>
                <BarChart3 size={16} className="text-slate-500" />
            </div>

            {analytics.length === 0 ? (
                <p className="text-slate-600 text-sm italic">Complete your first voice quiz to see mastery data.</p>
            ) : (
                <div className="space-y-6">
                    {analytics.map((item) => (
                        <div key={item.topic} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-sm font-bold text-white block">{item.topic}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter shadow-sm ${item.mastery_status === 'Mastered' ? 'bg-accent-lime/10 text-accent-lime border border-accent-lime/20' :
                                            item.mastery_status === 'Learning' ? 'bg-accent-lime/5 text-accent-lime/50 border border-border-color' :
                                                'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        {item.mastery_status}
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-400">{item.mastery_score}%</span>
                            </div>

                            {/* The Progress Bar */}
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-border-color">
                                <div
                                    className={`h-full transition-all duration-1000 ${item.mastery_score >= 80 ? 'bg-accent-lime shadow-[0_0_10px_rgba(190,242,100,0.3)]' :
                                            item.mastery_score >= 50 ? 'bg-accent-lime/40' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${item.mastery_score}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-border-color flex items-center gap-2 text-slate-600 text-[9px] font-bold uppercase tracking-widest">
                <TrendingUp size={12} />
                Updated in real-time by AI
            </div>
        </div>
    );
}