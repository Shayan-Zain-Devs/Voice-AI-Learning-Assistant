import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, Loader2, Calendar, BookOpen } from 'lucide-react';
import { uploadTextbook } from '../api'; // Ensure this points to your api.ts
import { supabase } from '../supabaseClient';

interface Textbook {
    id: string;
    title: string;
    created_at: string;
    total_pages: number;
    pdf_url: string;
    exam_date: string;
}

export default function Textbooks() {
    // Form State
    const [title, setTitle] = useState("");
    const [examDate, setExamDate] = useState("");

    // UI State
    const [isUploading, setIsUploading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [books, setBooks] = useState<Textbook[]>([]);

    // 1. Fetch textbooks from Supabase on load
    const fetchBooks = async () => {
        try {
            setFetchLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('textbooks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(data || []);
        } catch (err) {
            console.error("Error fetching books:", err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    // 2. Handle File Upload to Backend
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!title) {
            alert("Please enter a textbook title first!");
            return;
        }

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to upload.");

            // Call our FastAPI backend
            const response = await uploadTextbook(file, user.id, title, examDate);

            console.log("Upload Success:", response);
            alert(`Success! "${title}" has been vectorized into ${response.chunks_processed} AI segments.`);

            // Reset form and refresh list
            setTitle("");
            setExamDate("");
            fetchBooks();
        } catch (error: any) {
            alert("Upload failed: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    // 3. Handle Delete (Optional but good for management)
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this textbook? All AI embeddings will be deleted.")) return;

        try {
            const { error } = await supabase.from('textbooks').delete().eq('id', id);
            if (error) throw error;
            setBooks(books.filter(b => b.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* SECTION: UPLOAD FORM */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Upload className="text-blue-500" size={22} />
                    Knowledge Injection
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-500 uppercase font-bold ml-1">Book Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Database Systems"
                            className="bg-slate-900 border border-slate-800 p-3 rounded-xl focus:border-blue-500 outline-none transition"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-500 uppercase font-bold ml-1">Exam Date (Optional)</label>
                        <input
                            type="date"
                            className="bg-slate-900 border border-slate-800 p-3 rounded-xl focus:border-blue-500 outline-none text-slate-400"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* DRAG & DROP ZONE */}
                <label className={`
          relative group cursor-pointer overflow-hidden
          bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-12 
          flex flex-col items-center justify-center 
          hover:border-blue-500/50 transition-all
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}>
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {isUploading ? (
                            <Loader2 className="text-blue-500 animate-spin" size={32} />
                        ) : (
                            <Upload className="text-blue-500" size={32} />
                        )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2 relative z-10">
                        {isUploading ? "AI is Processing..." : "Upload PDF Textbook"}
                    </h3>
                    <p className="text-slate-400 text-center max-w-sm text-sm relative z-10">
                        {isUploading
                            ? "We are splitting text and generating 768-dim vectors. This takes about 30 seconds..."
                            : "Drag and drop your syllabus or textbook. AI will learn it instantly."}
                    </p>

                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading || !title}
                    />
                </label>
            </section>

            {/* SECTION: LIBRARY LIST */}
            <section className="pt-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="text-blue-500" size={22} />
                            Your Knowledge Library
                        </h2>
                        <p className="text-slate-500 text-sm">Select a book to start a voice study session.</p>
                    </div>
                    <span className="text-xs font-mono text-slate-600">{books.length} Books Loaded</span>
                </div>

                {fetchLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-slate-700" size={32} />
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                        <FileText className="mx-auto text-slate-800 mb-4" size={48} />
                        <p className="text-slate-600">No textbooks uploaded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {books.map((book) => (
                            <div
                                key={book.id}
                                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-200">{book.title}</h4>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> {book.total_pages} Pages</span>
                                            {book.exam_date && (
                                                <span className="flex items-center gap-1"><Calendar size={12} /> Exam: {new Date(book.exam_date).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                                        Study
                                    </button>
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}