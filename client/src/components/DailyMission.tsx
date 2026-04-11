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
        <div className="bg-bg-card border border-border-color p-6 rounded-2xl animate-pulse mt-12">
            <Loader2 className="animate-spin text-slate-700 mx-auto" />
        </div>
    );

    if (!mission) return (
        <div className="bg-bg-card border border-border-color p-6 rounded-2xl mt-12">
            <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Today's Mission</h2>
            <p className="text-slate-400 text-sm italic">No tasks scheduled for today. Check your roadmap for upcoming sessions!</p>
        </div>
    );

    return (
        <div className="bg-bg-card border border-border-color p-6 rounded-2xl hover:border-accent-lime/30 transition-colors group mt-12 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Today's Mission</h2>
                <div className="w-2 h-2 rounded-full bg-accent-lime shadow-[0_0_8px_rgba(190,242,100,0.4)] animate-pulse"></div>
            </div>

            <div className="space-y-6">
                <div>
                    <p className="text-2xl font-black text-white leading-tight mb-2">
                        {mission.passing_criteria?.[0] || `Pages ${mission.page_range}`}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <BookOpen size={12} className="text-accent-lime/50" />
                        {mission.textbooks?.title}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Show pages as a tag if the title is now the topic */}
                    {mission.passing_criteria?.[0] && (
                        <span className="bg-accent-lime/10 text-accent-lime border border-accent-lime/20 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-tighter">
                            Pages {mission.page_range}
                        </span>
                    )}
                    
                    {/* Show other topics if they exist */}
                    {mission.passing_criteria?.slice(1).map((topic: string) => (
                        <span key={topic} className="bg-white/5 text-slate-400 border border-border-color px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                            #{topic}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}