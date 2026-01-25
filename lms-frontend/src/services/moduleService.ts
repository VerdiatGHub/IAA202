/**
 * Module Service - REST API implementation
 */

import { api } from '../lib/api';
import type { Module, CreateModuleDto, UpdateModuleDto } from '../types';

// Response types
interface ModulesApiResponse {
  modules: Module[];
}

/**
 * Get all modules for a course
 */
export async function getModules(courseId: string): Promise<Module[]> {
  const { data, error } = await api.get<ModulesApiResponse>(`/courses/${courseId}/modules`);

  if (error || !data) {
    throw new Error(error || 'Failed to fetch modules');
  }

  return data.modules;
}

/**
 * Get a single module by ID
 */
export async function getModuleById(courseId: string, moduleId: string): Promise<Module> {
  const { data, error } = await api.get<Module>(`/courses/${courseId}/modules/${moduleId}`);

  if (error || !data) {
    throw new Error(error || 'Failed to fetch module');
  }

  return data;
}

/**
 * Create a new module
 */
export async function createModule(courseId: string, moduleData: CreateModuleDto): Promise<Module> {
  const { data, error } = await api.post<Module>(`/courses/${courseId}/modules`, moduleData);

  if (error || !data) {
    throw new Error(error || 'Failed to create module');
  }

  return data;
}

/**
 * Update an existing module
 */
export async function updateModule(
  courseId: string,
  moduleId: string,
  updates: UpdateModuleDto
): Promise<Module> {
  const { data, error } = await api.put<Module>(`/courses/${courseId}/modules/${moduleId}`, updates);

  if (error || !data) {
    throw new Error(error || 'Failed to update module');
  }

  return data;
}

/**
 * Delete a module (cascades to lessons)
 */
export async function deleteModule(courseId: string, moduleId: string): Promise<void> {
  const { error } = await api.delete(`/courses/${courseId}/modules/${moduleId}`);

  if (error) {
    throw new Error(error);
  }
}

/**
 * Reorder modules within a course
 */
export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
  const { error } = await api.put(`/courses/${courseId}/modules/reorder`, { moduleIds });

  if (error) {
    throw new Error(error);
  }
}

// Export as service object
export const moduleService = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
};

export default moduleService;
