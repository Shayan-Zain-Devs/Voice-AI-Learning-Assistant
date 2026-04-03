const API_URL = "http://localhost:8000";

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
