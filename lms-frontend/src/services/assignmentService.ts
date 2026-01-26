import api from '../lib/api';

export interface Assignment {
    id: string;
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    createdAt: string;
    totalSubmissions: number;
    gradedCount: number;
    pendingCount: number;
}

export const assignmentService = {
    async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
        const response = await api.get(`/assignments?courseId=${courseId}`);
        return response.data.assignments;
    },

    async getAssignment(id: string): Promise<Assignment> {
        const response = await api.get(`/assignments/${id}`);
        return response.data;
    },
};

export default assignmentService;
