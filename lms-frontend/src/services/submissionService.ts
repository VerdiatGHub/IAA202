import api from '../lib/api';

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl?: string;
    content?: string;
    score?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
    student: {
        id: string;
        fullName: string;
        email: string;
    };
    assignment?: {
        maxScore: number;
        title: string;
    };
}

export interface GradeSubmissionData {
    score: number;
    feedback?: string;
}

interface SubmissionsResponse {
    submissions: Submission[];
}

export const submissionService = {
    async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
        const response = await api.get<SubmissionsResponse>(`/submissions?assignmentId=${assignmentId}`);
        return response.data?.submissions || [];
    },

    async getSubmission(id: string): Promise<Submission> {
        const response = await api.get<Submission>(`/submissions/${id}`);
        if (!response.data) {
            throw new Error('Submission not found');
        }
        return response.data;
    },

    async gradeSubmission(id: string, data: GradeSubmissionData): Promise<Submission> {
        const response = await api.put<Submission>(`/submissions/${id}/grade`, data);
        if (!response.data) {
            throw new Error('Failed to grade submission');
        }
        return response.data;
    },

    async submitAssignment(assignmentId: string, fileUrl?: string, content?: string): Promise<Submission> {
        const response = await api.post<Submission>('/submissions', {
            assignmentId,
            fileUrl,
            content,
        });
        if (!response.data) {
            throw new Error('Failed to submit assignment');
        }
        return response.data;
    },
};

export default submissionService;
