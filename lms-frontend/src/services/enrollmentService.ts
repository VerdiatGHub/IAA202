/**
 * Enrollment Service - REST API implementation
 */

import { api } from '../lib/api';
import type { Enrollment, Course } from '../types';

// Local types for API responses (not extending Enrollment to avoid course type conflicts)
interface EnrollmentApiData {
    id: string;
    studentId: string;
    courseId: string;
    progress: number;
    enrolledAt: string;
    completedAt?: string;
    course: {
        id: string;
        title: string;
        thumbnailUrl?: string;
        level?: string;
        category?: string;
        duration?: string;
        instructorName?: string;
        lessonCount?: number;
        description?: string;
    };
    student?: {
        id: string;
        fullName: string;
        email: string;
    };
}

interface EnrollmentsApiResponse {
    enrollments: EnrollmentApiData[];
}

interface EnrollmentStatsApiResponse {
    enrolledCourses?: number;
    completedCourses?: number;
    averageProgress?: number;
    totalEnrollments?: number;
}

// Get enrollments
export async function getEnrollments(options?: {
    studentId?: string;
    courseId?: string;
    limit?: number;
    offset?: number;
}): Promise<EnrollmentApiData[]> {
    const params = new URLSearchParams();
    if (options?.studentId) params.append('studentId', options.studentId);
    if (options?.courseId) params.append('courseId', options.courseId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/enrollments${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await api.get<EnrollmentsApiResponse>(endpoint);

    if (error || !data) {
        throw new Error(error || 'Failed to fetch enrollments');
    }

    return data.enrollments;
}

// Get current user's enrollments
export async function getMyEnrollments(): Promise<EnrollmentApiData[]> {
    const { data, error } = await api.get<EnrollmentsApiResponse>('/enrollments/my');

    if (error || !data) {
        throw new Error(error || 'Failed to fetch enrollments');
    }

    return data.enrollments;
}

// Get enrollment statistics
export async function getEnrollmentStats(): Promise<EnrollmentStatsApiResponse> {
    const { data, error } = await api.get<EnrollmentStatsApiResponse>('/enrollments/stats');
    if (error || !data) {
        throw new Error(error || 'Failed to fetch enrollment stats');
    }
    return data;
}

// Enroll in a course
export async function enrollInCourse(courseId: string): Promise<Enrollment> {
    const { data, error } = await api.post<Enrollment>('/enrollments', { courseId });
    if (error || !data) {
        throw new Error(error || 'Failed to enroll in course');
    }
    return data;
}

// Admin: Enroll a student in a course
export async function enrollStudent(studentId: string, courseId: string): Promise<Enrollment> {
    const { data, error } = await api.post<Enrollment>('/enrollments', { studentId, courseId });
    if (error || !data) {
        throw new Error(error || 'Failed to enroll student');
    }
    return data;
}

// Update enrollment progress
export async function updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    const { data, error } = await api.put<Enrollment>(`/enrollments/${enrollmentId}`, { progress });
    if (error || !data) {
        throw new Error(error || 'Failed to update progress');
    }
    return data;
}

// Unenroll from course
export async function unenroll(enrollmentId: string): Promise<void> {
    const { error } = await api.delete(`/enrollments/${enrollmentId}`);
    if (error) {
        throw new Error(error);
    }
}

// Check if enrolled in a course
export async function isEnrolled(courseId: string): Promise<{ enrolled: boolean; enrollment: EnrollmentApiData | null }> {
    try {
        const enrollments = await getMyEnrollments();
        const enrollment = enrollments.find(e => e.courseId === courseId);
        return {
            enrolled: Boolean(enrollment),
            enrollment: enrollment || null
        };
    } catch {
        return { enrolled: false, enrollment: null };
    }
}

// Get enrolled courses with details
export async function getEnrolledCourses(): Promise<Course[]> {
    const enrollments = await getMyEnrollments();

    // Map enrollments to courses with progress
    return enrollments.map(e => ({
        id: e.course.id,
        title: e.course.title,
        description: e.course.description || '',
        thumbnailUrl: e.course.thumbnailUrl,
        instructorId: '',
        isPublished: true,
        createdAt: e.enrolledAt,
        level: e.course.level as 'beginner' | 'intermediate' | 'advanced' | undefined,
        category: e.course.category,
        duration: e.course.duration,
        lessonCount: e.course.lessonCount,
    }));
}

// Export types for consumers
export type { EnrollmentApiData, EnrollmentStatsApiResponse };

// Export all functions
export const enrollmentService = {
    getEnrollments,
    getMyEnrollments,
    getEnrollmentStats,
    enrollInCourse,
    enrollStudent,
    updateProgress,
    unenroll,
    isEnrolled,
    getEnrolledCourses,
};

export default enrollmentService;
