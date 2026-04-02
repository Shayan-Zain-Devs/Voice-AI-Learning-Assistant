export default function MasteryHeatMap() {
    const skills = [
        { name: "ER Modeling", level: 90 },
        { name: "SQL Queries", level: 75 },
        { name: "Normalization", level: 40 },
        { name: "Indexing", level: 60 },
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Topic Mastery</h2>
            <div className="space-y-4">
                {skills.map(skill => (
                    <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1">
                            <span>{skill.name}</span>
                            <span className={skill.level < 50 ? "text-red-400" : "text-green-400"}>{skill.level}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${skill.level < 50 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${skill.level}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}