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
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Topic Mastery</h2>
                <BarChart3 size={16} className="text-slate-500" />
            </div>

            {analytics.length === 0 ? (
                <p className="text-slate-600 text-sm italic">Complete your first voice quiz to see mastery data.</p>
            ) : (
                <div className="space-y-5">
                    {analytics.map((item) => (
                        <div key={item.topic} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-sm font-semibold text-slate-200 block">{item.topic}</span>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.mastery_status === 'Mastered' ? 'bg-green-500/10 text-green-500' :
                                            item.mastery_status === 'Learning' ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-red-500/10 text-red-500'
                                        }`}>
                                        {item.mastery_status}
                                    </span>
                                </div>
                                <span className="text-sm font-mono text-slate-400">{item.mastery_score}%</span>
                            </div>

                            {/* The Progress Bar */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${item.mastery_score >= 80 ? 'bg-green-500' :
                                            item.mastery_score >= 50 ? 'bg-blue-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${item.mastery_score}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <TrendingUp size={12} />
                Updated in real-time by AI
            </div>
        </div>
    );
}