import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Target, Loader2 } from 'lucide-react';

interface DailyMissionProps {
    selectedBookId: string;
}

export default function DailyMission({ selectedBookId }: DailyMissionProps) {
    const [mission, setMission] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTodayMission() {
            if (!selectedBookId) return;

            setLoading(true);
            setMission(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // --- LOCAL DATE LOGIC (Pakistan) ---
            const localDate = new Date();
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;

            const { data } = await supabase
                .from('daily_schedules')
                .select(`*, textbooks ( title )`)
                .eq('user_id', user.id)
                .eq('textbook_id', selectedBookId)
                .eq('scheduled_date', today)
                .maybeSingle();

            if (data) setMission(data);
            setLoading(false);
        }
        fetchTodayMission();
    }, [selectedBookId]);

    if (loading) return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-pulse">
            <Loader2 className="animate-spin text-slate-700 mx-auto" />
        </div>
    );

    if (!mission) return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Today's Mission</h2>
            <p className="text-slate-400 text-sm italic">No tasks scheduled for today. Check your roadmap for upcoming sessions!</p>
        </div>
    );

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/30 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Today's Mission</h2>
                <Target size={16} className="text-blue-500 group-hover:animate-bounce" />
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-3xl font-black text-white">Pages {mission.page_range}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1 font-medium">
                        <BookOpen size={14} />
                        {mission.textbooks?.title}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {mission.passing_criteria?.map((topic: string) => (
                        <span key={topic} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                            #{topic}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}