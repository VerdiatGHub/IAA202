import React, { useState } from 'react';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { LessonList } from './LessonList';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Module, Lesson } from '../../types';
import './ModuleItem.css';

interface ModuleItemProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddLesson?: () => void;
  onEditLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  isPreviewMode?: boolean; // Hide editing controls in preview mode
}

/**
 * ModuleItem Component
 * 
 * Displays an individual module with:
 * - Module header with title and description
 * - Lesson count and total duration
 * - Edit and delete buttons (hidden in preview mode)
 * - Expand/collapse functionality for lessons
 * 
 * Validates Requirements: 10.2, 10.5, 11.2
 */
export const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  isPreviewMode = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete module:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditLesson = (lesson: Lesson) => {
    onEditLesson?.(lesson);
  };

  const handleDeleteLesson = (lessonId: string) => {
    onDeleteLesson?.(lessonId);
  };

  // Calculate total duration from lessons
  const totalDuration = module.lessons?.reduce((sum, lesson) => {
    return sum + (lesson.duration || 0);
  }, 0) || 0;

  const lessonCount = module.lessons?.length || 0;

  return (
    <div className="module-item">
      <div className="module-header" onClick={onToggleExpand}>
        {/* Hide drag handle in preview mode (Requirement 11.2) */}
        {!isPreviewMode && (
          <div className="module-drag-handle" title="Drag to reorder">
            <GripVertical size={20} />
          </div>
        )}
        <div className="module-info">
          <span className="module-number">Module {index + 1}</span>
          <h3 className="module-title">{module.title}</h3>
          {module.description && (
            <p className="module-description">{module.description}</p>
          )}
        </div>
        <div className="module-actions">
          <div className="module-meta">
            <span className="lesson-count">
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
            </span>
            {totalDuration > 0 && (
              <>
                <span className="meta-separator">•</span>
                <span className="module-duration">
                  {totalDuration} {totalDuration === 1 ? 'min' : 'mins'}
                </span>
              </>
            )}
          </div>
          <div className="module-buttons">
            {/* Hide edit/delete buttons in preview mode (Requirement 11.2) */}
            {!isPreviewMode && onEdit && (
              <button
                className="icon-button"
                onClick={handleEdit}
                title="Edit module"
                aria-label="Edit module"
              >
                <Edit2 size={16} />
              </button>
            )}
            {!isPreviewMode && onDelete && (
              <button
                className="icon-button icon-button-danger"
                onClick={handleDeleteClick}
                title="Delete module"
                aria-label="Delete module"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="module-content">
          <LessonList
            lessons={module.lessons || []}
            moduleId={module.id}
            onAddLesson={() => onAddLesson?.()}
            onEditLesson={onEditLesson ? handleEditLesson : undefined}
            onDeleteLesson={onDeleteLesson ? handleDeleteLesson : undefined}
            isPreviewMode={isPreviewMode}
          />
        </div>
      )}

      {/* Confirmation dialog for module deletion (Requirement 1.3) */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Module"
        message={`Are you sure you want to delete "${module.title}"? All lessons and content within this module will also be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Module"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ModuleItem;
