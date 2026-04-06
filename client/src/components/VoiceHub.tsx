import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Loader2, Volume2, AlertCircle, ChevronDown, BookOpen, Square } from 'lucide-react';
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
            recognition.interimResults = true; // Show text as it's spoken

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

            // SECURITY CHECK: If backend returned an error string in the array
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
        setCurrentTranscript(""); // Clear for next question

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
            {/* Textbook Selector */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-300">Active Subject:</span>
                </div>
                <div className="relative">
                    <select
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-sm p-2 pr-8 rounded-lg outline-none appearance-none cursor-pointer focus:border-blue-500"
                    >
                        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl min-h-[550px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* IDLE STATE */}
                {status === 'idle' && (
                    <div className="space-y-6 animate-in fade-in duration-700 relative z-10">
                        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4 border border-blue-500/20 shadow-lg">
                            <Volume2 size={40} />
                        </div>
                        {todayTask ? (
                            <>
                                <h2 className="text-3xl font-bold">Daily Oral Exam</h2>
                                <p className="text-slate-400">Ready for 5 questions on Pages {todayTask.page_range}?</p>
                                <button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-2xl font-bold transition-transform hover:scale-105 flex items-center gap-3 mx-auto">
                                    <Play size={20} fill="currentColor" /> Start Quiz
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-slate-500 italic">No study tasks scheduled for this book today.</p>
                                <p className="text-xs text-slate-600">Check your roadmap or switch subjects.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVE QUIZ STATE */}
                {status === 'active' && (
                    <div className="space-y-10 w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-blue-500 font-mono text-xs font-black uppercase tracking-[0.3em]">Question {currentIdx + 1} of 5</div>
                        <h2 className="text-3xl font-semibold leading-tight min-h-[120px] flex items-center justify-center">
                            {questions[currentIdx]}
                        </h2>

                        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 min-h-[100px] flex items-center justify-center relative group">
                            {currentTranscript ? (
                                <p className="text-xl text-blue-100 italic leading-relaxed animate-in fade-in slide-in-from-top-1">
                                    "{currentTranscript.trim()}"
                                </p>
                            ) : (
                                <p className="text-slate-500 italic text-sm">Your answer will appear here as you speak...</p>
                            )}
                            {currentTranscript && !isRecording && (
                                <button 
                                    onClick={() => setCurrentTranscript("")}
                                    className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <AlertCircle size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-8">
                                <button
                                    onClick={toggleMic}
                                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${isRecording
                                            ? 'bg-red-600 animate-pulse scale-110 shadow-red-900/50'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                        }`}
                                >
                                    {isRecording ? <Square size={24} className="text-white fill-white" /> : <Mic size={32} className="text-white" />}
                                    <span className="text-[10px] font-black mt-1 text-white">
                                        {isRecording ? "STOP" : "SPEAK"}
                                    </span>
                                </button>

                                {currentTranscript && !isRecording && (
                                    <button
                                        onClick={processAnswer}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-900/40 animate-in zoom-in duration-300"
                                    >
                                        Confirm & Next <Play size={18} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                            
                            <p className="text-slate-400 font-medium">
                                {isRecording ? "Listening... click STOP when finished" : currentTranscript ? "Check your answer above" : "Click mic to record your response"}
                            </p>
                        </div>
                    </div>
                )}

                {/* LOADING / GRADING STATES */}
                {(status === 'loading' || status === 'grading') && (
                    <div className="flex flex-col items-center gap-6">
                        <Loader2 className="animate-spin text-blue-500" size={56} />
                        <p className="text-slate-300 font-bold tracking-wide">
                            {status === 'loading' ? "AI is generating questions..." : "Evaluating your answers..."}
                        </p>
                    </div>
                )}

                {/* FINISHED STATE */}
                {status === 'finished' && finalReport && (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                        <div className={`text-8xl font-black italic tracking-tighter ${finalReport.score >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                            {finalReport.score}%
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 max-w-lg mx-auto">
                            <p className="text-lg text-slate-200 leading-relaxed italic">"{finalReport.feedback}"</p>
                        </div>
                        <button onClick={() => setStatus('idle')} className="text-slate-500 hover:text-blue-400 font-bold transition text-sm underline">Close Session</button>
                    </div>
                )}
            </div>
        </div>
    );
}