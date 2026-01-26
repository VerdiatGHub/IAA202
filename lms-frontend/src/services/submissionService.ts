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

export const submissionService = {
    async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
        const response = await api.get(`/submissions?assignmentId=${assignmentId}`);
        return response.data.submissions;
    },

    async getSubmission(id: string): Promise<Submission> {
        const response = await api.get(`/submissions/${id}`);
        return response.data;
    },

    async gradeSubmission(id: string, data: GradeSubmissionData): Promise<Submission> {
        const response = await api.put(`/submissions/${id}/grade`, data);
        return response.data;
    },

    async submitAssignment(assignmentId: string, fileUrl?: string, content?: string): Promise<Submission> {
        const response = await api.post('/submissions', {
            assignmentId,
            fileUrl,
            content,
        });
        return response.data;
    },
};

export default submissionService;
