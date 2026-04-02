export default function RoadMap() {
    const days = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">30-Day Roadmap</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {days.map(day => (
                    <div
                        key={day}
                        className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center border transition ${day === 4 ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700 opacity-50'}`}
                    >
                        <span className="text-[10px] uppercase">Day</span>
                        <span className="text-lg font-bold">{day}</span>
                    </div>
                ))}
                <div className="flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center border border-dashed border-slate-700 text-slate-600 italic">
                    ...
                </div>
            </div>
        </div>
    );
}