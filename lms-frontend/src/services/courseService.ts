/**
 * Course Service - REST API implementation
 */

import { api } from '../lib/api';
import type { Course, Lesson } from '../types';

// Response types
interface CoursesApiResponse {
    courses: Course[];
}

// Standalone type for course with lessons (avoids extending Course which has instructor?: User)
interface CourseWithLessonsData {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    instructorId: string;
    isPublished: boolean;
    isPublic?: boolean;
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    enrollmentCount?: number;
    lessonCount?: number;
    createdAt: string;
    updatedAt?: string;
    lessons: Lesson[];
    instructor: {
        id: string;
        fullName: string;
        email: string;
    };
}

interface CourseStatsApiResponse {
    total: number;
    published: number;
    totalEnrollments: number;
}

interface CreateCourseData {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
}

interface UpdateCourseData {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    isPublished?: boolean;
    isPublic?: boolean;
}

// Get all courses
export async function getCourses(options?: {
    published?: boolean;
    instructorId?: string;
    category?: string;
    level?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<Course[]> {
    const params = new URLSearchParams();
    if (options?.published !== undefined) params.append('published', options.published.toString());
    if (options?.instructorId) params.append('instructorId', options.instructorId);
    if (options?.category) params.append('category', options.category);
    if (options?.level) params.append('level', options.level);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/courses${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await api.get<CoursesApiResponse>(endpoint);

    if (error || !data) {
        throw new Error(error || 'Failed to fetch courses');
    }

    return data.courses;
}

// Get published courses (for catalog)
export async function getPublishedCourses(options?: {
    category?: string;
    level?: string;
    search?: string;
}): Promise<Course[]> {
    return getCourses({ ...options, published: true });
}

// Get course by ID with lessons
export async function getCourseById(courseId: string): Promise<CourseWithLessonsData> {
    const { data, error } = await api.get<CourseWithLessonsData>(`/courses/${courseId}`);
    if (error || !data) {
        throw new Error(error || 'Failed to fetch course');
    }
    return data;
}

// Get course statistics (admin only) - returns format expected by AdminDashboard
export async function getCourseStats(): Promise<{
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
}> {
    const { data, error } = await api.get<CourseStatsApiResponse>('/courses/stats');

    if (error || !data) {
        throw new Error(error || 'Failed to fetch course stats');
    }

    return {
        totalCourses: data.total,
        publishedCourses: data.published,
        totalEnrollments: data.totalEnrollments,
    };
}

// Create new course (instructor/admin only)
export async function createCourse(courseData: CreateCourseData): Promise<Course> {
    const { data, error } = await api.post<Course>('/courses', courseData);
    if (error || !data) {
        throw new Error(error || 'Failed to create course');
    }
    return data;
}

// Update course
export async function updateCourse(courseId: string, updates: UpdateCourseData): Promise<Course> {
    const { data, error } = await api.put<Course>(`/courses/${courseId}`, updates);
    if (error || !data) {
        throw new Error(error || 'Failed to update course');
    }
    return data;
}

// Publish/unpublish course
export async function toggleCoursePublished(courseId: string, isPublished: boolean): Promise<Course> {
    return updateCourse(courseId, { isPublished });
}

// Delete course
export async function deleteCourse(courseId: string): Promise<void> {
    const { error } = await api.delete(`/courses/${courseId}`);
    if (error) {
        throw new Error(error);
    }
}

// Export types for consumers
export type { CourseWithLessonsData };

// Export all functions
export const courseService = {
    getCourses,
    getPublishedCourses,
    getCourseById,
    getCourseStats,
    createCourse,
    updateCourse,
    toggleCoursePublished,
    deleteCourse,
};

export default courseService;
