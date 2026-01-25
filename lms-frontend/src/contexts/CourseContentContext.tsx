import React, { useState, useCallback } from 'react';
import { CourseContentContext } from './useCourseContent';
import type { Module, CreateModuleDto, UpdateModuleDto, CreateLessonDto, UpdateLessonDto, CreateContentItemDto, UpdateContentItemDto, Lesson, ContentItem } from '../types';
import { moduleService } from '../services/moduleService';
import { lessonService } from '../services/lessonService';
import { contentItemService } from '../services/contentItemService';

interface CourseContentProviderProps {
  children: React.ReactNode;
  courseId: string;
}

export const CourseContentProvider: React.FC<CourseContentProviderProps> = ({ children, courseId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh content - load all modules with nested lessons and content items
  const refreshContent = useCallback(async () => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all modules for the course
      const fetchedModules = await moduleService.getModules(courseId);

      // For each module, fetch its lessons
      const modulesWithLessons = await Promise.all(
        fetchedModules.map(async (module) => {
          try {
            const lessons = await lessonService.getLessons(courseId, module.id);
            
            // For each lesson, fetch its content items
            const lessonsWithContent = await Promise.all(
              lessons.map(async (lesson) => {
                try {
                  const contentItems = await contentItemService.getContentItems(lesson.id);
                  return { ...lesson, contentItems };
                } catch (err) {
                  console.error(`Error fetching content items for lesson ${lesson.id}:`, err);
                  return { ...lesson, contentItems: [] };
                }
              })
            );

            return { ...module, lessons: lessonsWithContent };
          } catch (err) {
            console.error(`Error fetching lessons for module ${module.id}:`, err);
            return { ...module, lessons: [] };
          }
        })
      );

      setModules(modulesWithLessons);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load course content';
      setError(message);
      console.error('Error loading course content:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Module operations
  const addModule = useCallback(async (moduleData: CreateModuleDto): Promise<Module> => {
    setLoading(true);
    setError(null);

    try {
      const newModule = await moduleService.createModule(courseId, moduleData);
      
      // Add the new module to state with empty lessons array
      setModules((prev) => [...prev, { ...newModule, lessons: [] }]);
      
      return newModule;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create module';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const updateModule = useCallback(async (id: string, data: UpdateModuleDto): Promise<Module> => {
    setLoading(true);
    setError(null);

    try {
      const updatedModule = await moduleService.updateModule(courseId, id, data);
      
      // Update the module in state
      setModules((prev) =>
        prev.map((module) =>
          module.id === id ? { ...module, ...updatedModule } : module
        )
      );
      
      return updatedModule;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update module';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const deleteModule = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await moduleService.deleteModule(courseId, id);
      
      // Remove the module from state
      setModules((prev) => prev.filter((module) => module.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete module';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const reorderModules = useCallback(async (moduleIds: string[]): Promise<void> => {
    setLoading(true);
    setError(null);

    // Store previous state for rollback
    const previousModules = [...modules];

    try {
      // Optimistically update the UI
      const reorderedModules = moduleIds
        .map((id) => modules.find((m) => m.id === id))
        .filter((m): m is Module => m !== undefined);
      
      setModules(reorderedModules);

      // Make API call
      await moduleService.reorderModules(courseId, moduleIds);
    } catch (err) {
      // Rollback on error
      setModules(previousModules);
      const message = err instanceof Error ? err.message : 'Failed to reorder modules';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId, modules]);

  // Lesson operations
  const addLesson = useCallback(async (moduleId: string, lessonData: CreateLessonDto): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const newLesson = await lessonService.createLesson(courseId, moduleId, lessonData);
      
      // Add the new lesson to the appropriate module in state
      setModules((prev) =>
        prev.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                lessons: [...(module.lessons || []), { ...newLesson, contentItems: [] }],
              }
            : module
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const updateLesson = useCallback(async (id: string, data: UpdateLessonDto): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updatedLesson = await lessonService.updateLesson(id, data);
      
      // Update the lesson in state
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).map((lesson) =>
            lesson.id === id ? { ...lesson, ...updatedLesson } : lesson
          ),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLesson = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await lessonService.deleteLesson(id);
      
      // Remove the lesson from state
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).filter((lesson) => lesson.id !== id),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderLessons = useCallback(async (moduleId: string, lessonIds: string[]): Promise<void> => {
    setLoading(true);
    setError(null);

    // Store previous state for rollback
    const previousModules = [...modules];

    try {
      // Optimistically update the UI
      setModules((prev) =>
        prev.map((module) => {
          if (module.id !== moduleId) return module;
          
          const reorderedLessons = lessonIds
            .map((id) => (module.lessons || []).find((l) => l.id === id))
            .filter((l): l is Lesson & { contentItems?: ContentItem[] } => l !== undefined);
          
          return { ...module, lessons: reorderedLessons };
        })
      );

      // Make API call
      await lessonService.reorderLessons(courseId, moduleId, lessonIds);
    } catch (err) {
      // Rollback on error
      setModules(previousModules);
      const message = err instanceof Error ? err.message : 'Failed to reorder lessons';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId, modules]);

  // Content item operations
  const addContentItem = useCallback(async (lessonId: string, itemData: CreateContentItemDto): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const newContentItem = await contentItemService.createContentItem(lessonId, itemData);
      
      // Add the new content item to the appropriate lesson in state
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).map((lesson: Lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  contentItems: [...(lesson.contentItems || []), newContentItem],
                }
              : lesson
          ),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create content item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContentItem = useCallback(async (id: string, data: UpdateContentItemDto): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updatedContentItem = await contentItemService.updateContentItem(id, data);
      
      // Update the content item in state
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).map((lesson: Lesson) => ({
            ...lesson,
            contentItems: (lesson.contentItems || []).map((item: ContentItem) =>
              item.id === id ? { ...item, ...updatedContentItem } : item
            ),
          })),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update content item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContentItem = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await contentItemService.deleteContentItem(id);
      
      // Remove the content item from state
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).map((lesson: Lesson) => ({
            ...lesson,
            contentItems: (lesson.contentItems || []).filter((item: ContentItem) => item.id !== id),
          })),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete content item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderContentItems = useCallback(async (lessonId: string, itemIds: string[]): Promise<void> => {
    setLoading(true);
    setError(null);

    // Store previous state for rollback
    const previousModules = [...modules];

    try {
      // Optimistically update the UI
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: (module.lessons || []).map((lesson: Lesson) => {
            if (lesson.id !== lessonId) return lesson;
            
            const reorderedItems = itemIds
              .map((id) => (lesson.contentItems || []).find((item: ContentItem) => item.id === id))
              .filter((item): item is ContentItem => item !== undefined);
            
            return { ...lesson, contentItems: reorderedItems };
          }),
        }))
      );

      // Make API call
      await contentItemService.reorderContentItems(lessonId, itemIds);
    } catch (err) {
      // Rollback on error
      setModules(previousModules);
      const message = err instanceof Error ? err.message : 'Failed to reorder content items';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [modules]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <CourseContentContext.Provider
      value={{
        modules,
        loading,
        error,
        addModule,
        updateModule,
        deleteModule,
        reorderModules,
        addLesson,
        updateLesson,
        deleteLesson,
        reorderLessons,
        addContentItem,
        updateContentItem,
        deleteContentItem,
        reorderContentItems,
        refreshContent,
        clearError,
      }}
    >
      {children}
    </CourseContentContext.Provider>
  );
};

export default CourseContentProvider;
