const API_URL = "http://localhost:8000";

export interface VoiceSessionResponse {
    questions: string[];
    context: string;
}

export interface QuizReport {
    score: number;
    feedback: string;
    topics_to_review: string[];
}


export const uploadTextbook = async (file: File, userId: string, title: string, examDate?: string) => {
    // Since we are sending a file + text, we must use FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("title", title);
    if (examDate) formData.append("exam_date", examDate);

    const response = await fetch(`${API_URL}/upload-textbook`, {
        method: "POST",
        body: formData,
        // Note: Don't set Content-Type header; the browser does it automatically for FormData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload textbook");
    }

    return await response.json();
};

export const generateRoadmap = async (textbookId: string, userId: string) => {
    const formData = new FormData();
    formData.append("textbook_id", textbookId);
    formData.append("user_id", userId);

    const response = await fetch(`${API_URL}/generate-roadmap`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to generate AI roadmap");
    }

    return await response.json();
};


export const startVoiceSession = async (scheduleId: string, textbookId: string): Promise<VoiceSessionResponse> => {
    const formData = new FormData();
    formData.append("schedule_id", scheduleId);
    formData.append("textbook_id", textbookId);

    const response = await fetch(`${API_URL}/voice/start-session`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) throw new Error("Failed to start voice session");
    return await response.json();
};

export const completeVoiceSession = async (
    userId: string,
    scheduleId: string,
    textbookId: string,
    questions: string[],
    answers: string[],
    context: string
): Promise<QuizReport> => {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("schedule_id", scheduleId);
    formData.append("textbook_id", textbookId);
    // Convert arrays to JSON strings so FastAPI can parse them
    formData.append("questions", JSON.stringify(questions));
    formData.append("answers", JSON.stringify(answers));
    formData.append("context", context);

    const response = await fetch(`${API_URL}/voice/complete-session`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) throw new Error("Failed to evaluate quiz session");
    return await response.json();
};