import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, BookOpen, CheckCircle2, Clock, ChevronDown, Loader2 } from 'lucide-react';

interface RoadmapProps {
    selectedBookId: string;
    setSelectedBookId: (id: string) => void;
}

export default function Roadmap({ selectedBookId, setSelectedBookId }: RoadmapProps) {
    const [books, setBooks] = useState<any[]>([]); // List of all uploaded books
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch the list of books first
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userBooks } = await supabase
                .from('textbooks')
                .select('id, title')
                .eq('user_id', user.id);

            if (userBooks && userBooks.length > 0) {
                setBooks(userBooks);
                // If nothing is selected globally, default to the first one
                if (!selectedBookId) setSelectedBookId(userBooks[0].id);
            } else {
                setLoading(false);
            }
        }
        init();
    }, [selectedBookId]);

    // 2. Fetch the specific roadmap whenever the selectedBookId changes
    useEffect(() => {
        if (!selectedBookId) return;

        async function getRoadmap() {
            setLoading(true);
            const { data, error } = await supabase
                .from('daily_schedules')
                .select('*')
                .eq('textbook_id', selectedBookId) // FILTER BY BOOK
                .order('scheduled_date', { ascending: true });

            if (!error && data) setSchedule(data);
            setLoading(false);
        }
        getRoadmap();
    }, [selectedBookId]);

    if (loading && books.length === 0) return <div className="p-20 text-center animate-pulse">Loading your AI roadmap...</div>;

    if (books.length === 0) return (
        <div className="bg-bg-card border border-border-color p-20 rounded-3xl text-center">
            <BookOpen className="mx-auto text-slate-700 mb-4" size={48} />
            <h2 className="text-xl font-bold text-white">No Roadmap Found</h2>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">Upload a textbook in the Library tab to generate your AI-powered study plan.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* 1. TEXTBOOK SELECTOR (The Multiple Book Handler) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Study Roadmap</h2>
                    <p className="text-slate-500 text-sm">Select a course to view your progress</p>
                </div>

                <div className="relative inline-block w-full md:w-72">
                    <select
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="w-full bg-bg-card border border-border-color p-3 pl-4 pr-10 rounded-xl appearance-none outline-none focus:border-accent-lime transition cursor-pointer font-medium text-white"
                    >
                        {books.map(book => (
                            <option key={book.id} value={book.id}>{book.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
            </div>

            {/* 2. THE TIMELINE */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent-lime" /></div>
            ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-8 mt-10">
                    {schedule.map((day) => (
                        <div key={day.id} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[41px] w-4 h-4 rounded-full border-4 border-slate-950 z-10 ${day.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'
                                }`}></div>

                            <div className="bg-bg-card border border-border-color p-6 rounded-2xl hover:border-accent-lime/50 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-accent-lime font-mono text-[10px] font-bold uppercase tracking-widest mb-1">
                                            <Calendar size={14} />
                                            {new Date(day.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-bold group-hover:text-accent-lime transition-colors text-white">
                                            {day.passing_criteria?.[0] || `Read Pages ${day.page_range}`}
                                        </h3>
                                    </div>

                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${day.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        {day.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {day.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
                                    <span className="bg-accent-lime/10 text-accent-lime px-3 py-1 rounded-md border border-accent-lime/20">
                                        Pages {day.page_range}
                                    </span>
                                    {day.passing_criteria?.slice(1).map((topic: string) => (
                                        <span key={topic} className="bg-white/5 text-slate-400 px-3 py-1 rounded-md border border-border-color">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}