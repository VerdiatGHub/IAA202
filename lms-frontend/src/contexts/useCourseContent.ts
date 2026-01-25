import { createContext, useContext } from 'react';
import type { Module, CreateModuleDto, UpdateModuleDto, CreateLessonDto, UpdateLessonDto, CreateContentItemDto, UpdateContentItemDto } from '../types';

interface CourseContentContextType {
  // State
  modules: Module[];
  loading: boolean;
  error: string | null;
  
  // Module operations
  addModule: (module: CreateModuleDto) => Promise<Module>;
  updateModule: (id: string, data: UpdateModuleDto) => Promise<Module>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (moduleIds: string[]) => Promise<void>;
  
  // Lesson operations
  addLesson: (moduleId: string, lesson: CreateLessonDto) => Promise<void>;
  updateLesson: (id: string, data: UpdateLessonDto) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  reorderLessons: (moduleId: string, lessonIds: string[]) => Promise<void>;
  
  // Content item operations
  addContentItem: (lessonId: string, item: CreateContentItemDto) => Promise<void>;
  updateContentItem: (id: string, data: UpdateContentItemDto) => Promise<void>;
  deleteContentItem: (id: string) => Promise<void>;
  reorderContentItems: (lessonId: string, itemIds: string[]) => Promise<void>;
  
  // Utility
  refreshContent: () => Promise<void>;
  clearError: () => void;
}

export const CourseContentContext = createContext<CourseContentContextType | undefined>(undefined);

export const useCourseContent = () => {
  const context = useContext(CourseContentContext);
  if (!context) {
    throw new Error('useCourseContent must be used within a CourseContentProvider');
  }
  return context;
};
