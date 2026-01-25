/**
 * Lesson Service - REST API implementation
 * Handles lesson CRUD operations within modules
 */

import { api } from '../lib/api';
import type { Lesson, CreateLessonDto, UpdateLessonDto } from '../types';

// Response types
interface LessonsApiResponse {
  lessons: Lesson[];
}

/**
 * Get all lessons for a module
 */
export async function getLessons(courseId: string, moduleId: string): Promise<Lesson[]> {
  const { data, error } = await api.get<LessonsApiResponse>(
    `/courses/${courseId}/modules/${moduleId}/lessons`
  );

  if (error || !data) {
    throw new Error(error || 'Failed to fetch lessons');
  }

  return data.lessons;
}

/**
 * Get a single lesson by ID
 */
export async function getLessonById(lessonId: string): Promise<Lesson> {
  const { data, error } = await api.get<Lesson>(`/lessons/${lessonId}`);

  if (error || !data) {
    throw new Error(error || 'Failed to fetch lesson');
  }

  return data;
}

/**
 * Create a new lesson within a module
 */
export async function createLesson(
  courseId: string,
  moduleId: string,
  lessonData: CreateLessonDto
): Promise<Lesson> {
  const { data, error } = await api.post<Lesson>(
    `/courses/${courseId}/modules/${moduleId}/lessons`,
    lessonData
  );

  if (error || !data) {
    throw new Error(error || 'Failed to create lesson');
  }

  return data;
}

/**
 * Update an existing lesson
 */
export async function updateLesson(
  lessonId: string,
  updates: UpdateLessonDto
): Promise<Lesson> {
  const { data, error } = await api.put<Lesson>(`/lessons/${lessonId}`, updates);

  if (error || !data) {
    throw new Error(error || 'Failed to update lesson');
  }

  return data;
}

/**
 * Delete a lesson (cascades to content items)
 */
export async function deleteLesson(lessonId: string): Promise<void> {
  const { error } = await api.delete(`/lessons/${lessonId}`);

  if (error) {
    throw new Error(error);
  }
}

/**
 * Reorder lessons within a module
 */
export async function reorderLessons(
  courseId: string,
  moduleId: string,
  lessonIds: string[]
): Promise<Lesson[]> {
  const { data, error } = await api.put<LessonsApiResponse>(
    `/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
    { lessonIds }
  );

  if (error || !data) {
    throw new Error(error || 'Failed to reorder lessons');
  }

  return data.lessons;
}

// Export as service object
export const lessonService = {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
};

export default lessonService;
