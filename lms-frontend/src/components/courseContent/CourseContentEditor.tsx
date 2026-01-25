import React, { useState, useEffect } from 'react';
import { ModuleList } from './ModuleList';
import { ModuleEditorModal } from './ModuleEditorModal';
import { LessonEditorModal } from './LessonEditorModal';
import { StudentContentView } from './StudentContentView';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Module, Lesson } from '../../types';
import { AlertCircle } from 'lucide-react';
import './CourseContentEditor.css';

interface CourseContentEditorProps {
  courseId: string; // courseId is needed for StudentContentView
}

export const CourseContentEditor: React.FC<CourseContentEditorProps> = ({ courseId }) => {
  const {
    refreshContent,
    deleteModule,
    deleteLesson,
    loading,
    error,
    clearError,
  } = useCourseContent();

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);

  // Editing states
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Context for creating new items
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Load content on mount
  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  // Module handlers
  const handleAddModule = () => {
    setEditingModule(null);
    setModuleModalOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleModalOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? All lessons and content within it will also be deleted.')) {
      return;
    }

    try {
      await deleteModule(moduleId);
      // Success toast is handled in the context
    } catch (error) {
      // Error toast is handled in the context
      console.error(error);
    }
  };

  const handleModuleSuccess = () => {
    setModuleModalOpen(false);
    setEditingModule(null);
  };

  // Lesson handlers
  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonModalOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    // When editing, we need to find the module that contains this lesson
    setEditingLesson(lesson);
    setLessonModalOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? All content within it will also be deleted.')) {
      return;
    }

    try {
      await deleteLesson(lessonId);
      // Success toast is handled in the context
    } catch (error) {
      // Error toast is handled in the context
      console.error(error);
    }
  };

  const handleLessonSuccess = () => {
    setLessonModalOpen(false);
    setEditingLesson(null);
    setSelectedModuleId(null);
  };

  // Get the moduleId for the lesson being edited
  const getModuleIdForLesson = (): string | undefined => {
    if (editingLesson) {
      // The lesson should have a moduleId property
      return (editingLesson as any).moduleId;
    }
    return selectedModuleId || undefined;
  };

  // Toggle preview mode
  const handleTogglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className="course-content-editor">
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={clearError} 
            className="error-dismiss"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Preview Mode Toggle Button */}
      <div className="editor-toolbar">
        <button
          className={`preview-toggle-btn ${isPreviewMode ? 'active' : ''}`}
          onClick={handleTogglePreview}
          type="button"
        >
          {isPreviewMode ? (
            <>
              <span className="icon">✏️</span>
              <span>Edit Mode</span>
            </>
          ) : (
            <>
              <span className="icon">👁️</span>
              <span>Preview Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Show StudentContentView in preview mode, otherwise show ModuleList (Requirement 11.2) */}
      {isPreviewMode ? (
        <StudentContentView courseId={courseId} />
      ) : (
        <>
          <ModuleList
            onAddModule={handleAddModule}
            onEditModule={handleEditModule}
            onDeleteModule={handleDeleteModule}
            onAddLesson={handleAddLesson}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            enableDragAndDrop={!isPreviewMode}
          />

          {/* Module Editor Modal */}
          {moduleModalOpen && (
            <ModuleEditorModal
              isOpen={moduleModalOpen}
              onClose={() => {
                setModuleModalOpen(false);
                setEditingModule(null);
              }}
              onSuccess={handleModuleSuccess}
              module={editingModule || undefined}
            />
          )}

          {/* Lesson Editor Modal */}
          {lessonModalOpen && getModuleIdForLesson() && (
            <LessonEditorModal
              isOpen={lessonModalOpen}
              onClose={() => {
                setLessonModalOpen(false);
                setEditingLesson(null);
                setSelectedModuleId(null);
              }}
              onSuccess={handleLessonSuccess}
              lesson={editingLesson || undefined}
              moduleId={getModuleIdForLesson()!}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CourseContentEditor;
