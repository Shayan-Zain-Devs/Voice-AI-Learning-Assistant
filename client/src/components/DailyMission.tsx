export default function DailyMission() {
    const topics = ["Normalization", "1NF vs 2NF", "Primary Keys"];

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Today's Mission</h2>
            <div className="space-y-4">
                <div>
                    <p className="text-3xl font-bold">Pages 45 - 60</p>
                    <p className="text-slate-400 text-sm">Chapter 3: Relational Design</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {topics.map(t => (
                        <span key={t} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">
                            #{t}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}