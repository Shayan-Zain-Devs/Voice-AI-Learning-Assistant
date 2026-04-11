import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Loader2, Volume2, ChevronDown, Square, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { startVoiceSession, completeVoiceSession, type QuizReport } from '../api';

interface TodayTask {
    id: string;
    textbook_id: string;
    page_range: string;
}

interface VoiceHubProps {
    selectedBookId: string;
    setSelectedBookId: React.Dispatch<React.SetStateAction<string>>;
}

export default function VoiceHub({ selectedBookId, setSelectedBookId }: VoiceHubProps) {
    // 1. Data States
    const [books, setBooks] = useState<any[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'grading' | 'finished'>('idle');
    const [todayTask, setTodayTask] = useState<TodayTask | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [context, setContext] = useState("");
    const [finalReport, setFinalReport] = useState<QuizReport | null>(null);

    // 2. Microphone & Transcription States
    const [isRecording, setIsRecording] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const recognitionRef = useRef<any>(null);

    // 3. Initial Load: Fetch Books
    useEffect(() => {
        async function fetchBooks() {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            const { data } = await supabase
                .from('textbooks')
                .select('id, title')
                .eq('user_id', user.id);

            if (data && data.length > 0) {
                setBooks(data);
                if (!selectedBookId) setSelectedBookId(data[0].id);
            }
        }
        fetchBooks();
    }, []);

    // 4. Fetch Task for the Selected Book
    useEffect(() => {
        async function getTodayTask() {
            if (!selectedBookId) return;

            setTodayTask(null);
            const { data: authData } = await supabase.auth.getUser();

            const localDate = new Date();
            const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

            const { data } = await supabase.from('daily_schedules')
                .select('id, textbook_id, page_range')
                .eq('user_id', authData.user?.id)
                .eq('textbook_id', selectedBookId)
                .eq('scheduled_date', today)
                .maybeSingle();

            if (data) setTodayTask(data as TodayTask);
        }
        getTodayTask();
    }, [selectedBookId]);

    // 5. AI Speech Engine
    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
    };

    // 6. Manual Microphone Logic (Start/Stop)
    const toggleMic = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            if (!SpeechRecognition) return alert("Browser not supported");

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsRecording(true);
                setCurrentTranscript("");
            };

            recognition.onresult = (event: any) => {
                let final = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    }
                }
                if (final) setCurrentTranscript(prev => prev + " " + final);
            };

            recognition.onerror = () => setIsRecording(false);
            recognition.onend = () => setIsRecording(false);

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    // 7. Quiz Flow Management
    const startQuiz = async () => {
        if (!todayTask) return;
        setStatus('loading');
        try {
            const data = await startVoiceSession(todayTask.id, todayTask.textbook_id);

            if (data.questions[0].includes("Error") || data.questions[0].includes("Could not")) {
                throw new Error(data.questions[0]);
            }

            setQuestions(data.questions);
            setContext(data.context);
            setCurrentIdx(0);
            setAnswers([]);
            setStatus('active');
            speak(data.questions[0]);
        } catch (err: any) {
            alert(err.message || "Failed to generate quiz. Check your AI API credits.");
            setStatus('idle');
        }
    };

    const processAnswer = () => {
        if (!currentTranscript.trim()) return alert("Please speak your answer first.");

        const updatedAnswers = [...answers, currentTranscript.trim()];
        setAnswers(updatedAnswers);
        setCurrentTranscript("");

        if (updatedAnswers.length < 5) {
            const nextIdx = updatedAnswers.length;
            setCurrentIdx(nextIdx);
            speak(`Got it. Next question: ${questions[nextIdx]}`);
        } else {
            submitForGrading(updatedAnswers);
        }
    };

    const submitForGrading = async (finalAnswers: string[]) => {
        if (!todayTask) return;
        setStatus('grading');
        try {
            const { data: authData } = await supabase.auth.getUser();
            const report = await completeVoiceSession(
                authData.user?.id || "",
                todayTask.id,
                todayTask.textbook_id,
                questions,
                finalAnswers,
                context
            );
            setFinalReport(report);
            setStatus('finished');
            speak(`Quiz complete. You scored ${report.score} percent.`);
        } catch (err) {
            alert("Grading Error: " + err);
            setStatus('active');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header: Textbook Selector - Sleek Minimalist Look */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-lime shadow-[0_0_8px_#bef264]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Active Subject
                    </span>
                </div>
                <div className="relative group">
                    <select
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="bg-transparent border-none text-sm font-semibold text-slate-200 focus:ring-0 cursor-pointer pr-8 hover:text-accent-lime transition-colors appearance-none"
                    >
                        {books.map(b => <option key={b.id} value={b.id} className="bg-bg-card text-white">{b.title}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-accent-lime transition-colors" />
                </div>
            </div>

            {/* Main Stage: Obsidian Glass Effect */}
            <div className="bg-bg-card border border-border-color rounded-2xl min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">

                {/* Background Decor - Subtle AI Aura */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-lime/5 blur-[100px] rounded-full pointer-events-none"></div>

                {/* IDLE STATE */}
                {status === 'idle' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 relative z-10">
                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 bg-accent-lime/10 rounded-full animate-ping opacity-20"></div>
                            <div className="relative w-20 h-20 bg-bg-card border border-border-color rounded-full flex items-center justify-center text-accent-lime shadow-xl">
                                <Volume2 size={32} />
                            </div>
                        </div>

                        {todayTask ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Daily Oral Exam</h2>
                                    <p className="text-slate-400 text-sm font-medium">Verify your mastery of <span className="text-slate-200">Pages {todayTask.page_range}</span></p>
                                </div>
                                <button
                                    onClick={startQuiz}
                                    className="bg-accent-lime hover:brightness-110 text-black px-10 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 mx-auto shadow-lg shadow-accent-lime/20"
                                >
                                    <Play size={18} fill="currentColor" /> Initialize Quiz
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 opacity-60">
                                <p className="text-slate-400 italic text-sm">Waiting for scheduled tasks...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVE QUIZ STATE */}
                {status === 'active' && (
                    <div className="space-y-12 w-full max-w-2xl px-8 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-accent-lime uppercase tracking-[0.3em]">
                                Session in progress
                            </span>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i < currentIdx ? 'bg-accent-lime' : i === currentIdx ? 'bg-accent-lime/40 animate-pulse' : 'bg-white/10'}`}></div>
                                ))}
                            </div>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug min-h-[100px]">
                            {questions[currentIdx]}
                        </h2>

                        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl min-h-[110px] flex items-center justify-center relative">
                            {currentTranscript ? (
                                <p className="text-lg text-slate-200 italic leading-relaxed">
                                    "{currentTranscript.trim()}"
                                </p>
                            ) : (
                                <p className="text-slate-600 text-sm font-medium tracking-wide">
                                    {isRecording ? "Listening for your response..." : "Awaiting voice input"}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-10">
                                <button
                                    onClick={toggleMic}
                                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative group ${isRecording
                                        ? 'bg-red-500/10 border-red-500/50 border animate-pulse'
                                        : 'bg-slate-800 border-slate-700 border hover:border-blue-500/50'
                                        }`}
                                >
                                    {isRecording ? (
                                        <Square size={24} className="text-red-500 fill-red-500" />
                                    ) : (
                                        <Mic size={28} className="text-white group-hover:text-accent-lime transition-colors" />
                                    )}
                                    <span className={`text-[9px] font-bold mt-2 uppercase tracking-tighter ${isRecording ? 'text-red-500' : 'text-slate-500'}`}>
                                        {isRecording ? "Stop" : "Speak"}
                                    </span>
                                </button>

                                {currentTranscript && !isRecording && (
                                    <button
                                        onClick={processAnswer}
                                        className="bg-white text-black px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-accent-lime hover:text-black transition-all shadow-xl animate-in zoom-in duration-300"
                                    >
                                        Next Question <Play size={14} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* LOADING / GRADING STATES */}
                {(status === 'loading' || status === 'grading') && (
                    <div className="flex flex-col items-center gap-4 py-10 relative z-10">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-accent-lime/10 border-t-accent-lime animate-spin"></div>
                            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-lime animate-pulse" size={24} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
                            {status === 'loading' ? "Synthesizing Quiz" : "Analyzing Mastery"}
                        </p>
                    </div>
                )}

                {/* FINISHED STATE */}
                {status === 'finished' && finalReport && (
                    <div className="space-y-10 animate-in zoom-in-95 duration-500 relative z-10 px-8 py-6 w-full max-w-lg">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`text-7xl font-black italic tracking-tighter font-mono ${finalReport.score >= 60 ? 'text-accent-lime' : 'text-red-400'} drop-shadow-[0_0_20px_rgba(190,242,100,0.2)]`}>
                                {finalReport.score}%
                            </div>
                            <div className="flex items-center gap-2">
                                {finalReport.score >= 60 ? <CheckCircle2 size={16} className="text-accent-lime" /> : <XCircle size={16} className="text-red-500" />}
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                    {finalReport.score >= 60 ? 'Mastery Confirmed' : 'Review Suggested'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl relative">
                            <div className="absolute -top-3 left-6 px-2 bg-slate-900 text-[10px] font-bold text-slate-500 uppercase">AI Feedback</div>
                            <p className="text-slate-300 leading-relaxed text-sm italic">"{finalReport.feedback}"</p>
                        </div>

                        <button
                            onClick={() => setStatus('idle')}
                            className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border-b border-transparent hover:border-white pb-1"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-700 rounded-full"></div> 5 Context Questions</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-700 rounded-full"></div> Real-time STT</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-700 rounded-full"></div> Dynamic Grading</div>
            </div>
        </div>
    );
}