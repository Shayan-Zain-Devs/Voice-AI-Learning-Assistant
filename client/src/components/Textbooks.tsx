import { Upload, FileText, Trash2, CheckCircle2, Clock } from 'lucide-react';

export default function Textbooks() {
    // Sample data - eventually this comes from your 'textbooks' table in Supabase
    const uploadedBooks = [
        { id: 1, title: "Database System Concepts.pdf", date: "2024-03-28", status: "ready" },
        { id: 2, title: "Operating Systems.pdf", date: "2024-04-01", status: "processing" },
    ];

    return (
        <div className="space-y-8">
            {/* 1. Upload Section */}
            <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-blue-500/50 transition-colors group cursor-pointer">
                <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload New Textbook</h3>
                <p className="text-slate-400 text-center max-w-sm">
                    Drag and drop your PDF here, or click to browse. AI will start chunking and vectorizing immediately.
                </p>
                <input type="file" className="hidden" accept=".pdf" />
            </div>

            {/* 2. Library List */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="text-blue-500" size={20} />
                    Your Library
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    {uploadedBooks.map((book) => (
                        <div key={book.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-200">{book.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-slate-500">Uploaded on {book.date}</span>
                                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${book.status === 'ready' ? 'text-green-500' : 'text-amber-500'}`}>
                                            {book.status === 'ready' ? (
                                                <><CheckCircle2 size={10} /> Vectorized</>
                                            ) : (
                                                <><Clock size={10} /> Processing...</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-500 hover:text-white transition">Study Now</button>
                                <button className="p-2 text-slate-500 hover:text-red-500 transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}