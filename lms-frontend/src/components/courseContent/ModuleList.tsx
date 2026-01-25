import React, { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/Loading';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Module } from '../../types';
import './ModuleList.css';

interface ModuleListProps {
  onAddModule: () => void;
  onEditModule?: (module: Module) => void;
  onDeleteModule?: (moduleId: string) => void;
  onAddLesson?: (moduleId: string) => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({ 
  onAddModule, 
  onEditModule,
  onDeleteModule,
  onAddLesson
}) => {
  const { modules, loading, error } = useCourseContent();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleEditModule = (e: React.MouseEvent, module: Module) => {
    e.stopPropagation();
    onEditModule?.(module);
  };

  const handleDeleteModule = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this module? All lessons within it will also be deleted.')) {
      onDeleteModule?.(moduleId);
    }
  };

  const handleAddLesson = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    onAddLesson?.(moduleId);
  };

  // Sort modules by orderIndex (Requirement 8.5)
  const sortedModules = [...modules].sort((a, b) => a.orderIndex - b.orderIndex);

  // Loading state
  if (loading && sortedModules.length === 0) {
    return (
      <div className="module-list-loading">
        <LoadingSpinner size="lg" />
        <p>Loading modules...</p>
      </div>
    );
  }

  // Error state
  if (error && sortedModules.length === 0) {
    return (
      <div className="module-list-error">
        <p className="error-message">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (sortedModules.length === 0) {
    return (
      <div className="module-list-empty">
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No modules yet</h3>
          <p>Get started by creating your first module to organize your course content.</p>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onAddModule}>
            Add Module
          </Button>
        </div>
      </div>
    );
  }

  // Modules list
  return (
    <div className="module-list">
      <div className="module-list-header">
        <h2>Course Content</h2>
        <Button variant="primary" icon={<Plus size={16} />} onClick={onAddModule}>
          Add Module
        </Button>
      </div>

      <div className="modules-container">
        {sortedModules.map((module, index) => (
          <div key={module.id} className="module-item">
            <div className="module-header" onClick={() => toggleModule(module.id)}>
              <div className="module-drag-handle" title="Drag to reorder">
                <GripVertical size={20} />
              </div>
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
                    {module.lessons?.length || 0} {module.lessons?.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>
                <div className="module-buttons">
                  {onEditModule && (
                    <button
                      className="icon-button"
                      onClick={(e) => handleEditModule(e, module)}
                      title="Edit module"
                      aria-label="Edit module"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {onDeleteModule && (
                    <button
                      className="icon-button icon-button-danger"
                      onClick={(e) => handleDeleteModule(e, module.id)}
                      title="Delete module"
                      aria-label="Delete module"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    className={`expand-button ${expandedModules.has(module.id) ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModule(module.id);
                    }}
                    aria-label={expandedModules.has(module.id) ? 'Collapse module' : 'Expand module'}
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

            {expandedModules.has(module.id) && (
              <div className="module-content">
                {module.lessons && module.lessons.length > 0 ? (
                  <div className="lessons-placeholder">
                    <p>Lessons will be displayed here</p>
                    <p className="text-muted">
                      {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'} in this module
                    </p>
                  </div>
                ) : (
                  <div className="no-lessons">
                    <p>No lessons in this module yet</p>
                  </div>
                )}
                {onAddLesson && (
                  <div className="add-lesson-container">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Plus size={14} />}
                      onClick={(e) => handleAddLesson(e, module.id)}
                    >
                      Add Lesson
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && sortedModules.length > 0 && (
        <div className="module-list-updating">
          <LoadingSpinner size="sm" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default ModuleList;
