import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, BookOpen, CheckCircle2, Clock, ChevronDown, Loader2 } from 'lucide-react';

export default function Roadmap() {
    const [books, setBooks] = useState<any[]>([]); // List of all uploaded books
    const [selectedBookId, setSelectedBookId] = useState<string>(""); // Current filter
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
                setSelectedBookId(userBooks[0].id); // Default to the first book
            } else {
                setLoading(false);
            }
        }
        init();
    }, []);

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
        <div className="bg-slate-900 border border-slate-800 p-20 rounded-3xl text-center">
            <BookOpen className="mx-auto text-slate-700 mb-4" size={48} />
            <h2 className="text-xl font-bold">No Roadmap Found</h2>
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
                        className="w-full bg-slate-900 border border-slate-800 p-3 pl-4 pr-10 rounded-xl appearance-none outline-none focus:border-blue-500 transition cursor-pointer font-medium"
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
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-8 mt-10">
                    {schedule.map((day) => (
                        <div key={day.id} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[41px] w-4 h-4 rounded-full border-4 border-slate-950 z-10 ${day.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'
                                }`}></div>

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs font-bold uppercase tracking-widest mb-1">
                                            <Calendar size={14} />
                                            {new Date(day.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                                            {day.passing_criteria?.[0] || `Read Pages ${day.page_range}`}
                                        </h3>
                                    </div>

                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${day.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        {day.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {day.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md border border-blue-500/20">
                                        Pages {day.page_range}
                                    </span>
                                    {day.passing_criteria?.slice(1).map((topic: string) => (
                                        <span key={topic} className="bg-slate-800/50 text-slate-400 px-3 py-1 rounded-md border border-slate-800">
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