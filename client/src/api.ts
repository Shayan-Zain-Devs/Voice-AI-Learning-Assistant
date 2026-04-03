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