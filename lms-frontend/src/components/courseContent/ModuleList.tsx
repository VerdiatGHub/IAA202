import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/Loading';
import { useCourseContent } from '../../contexts/useCourseContent';
import { ModuleItem } from './ModuleItem';
import type { Module, Lesson } from '../../types';
import './ModuleList.css';

interface ModuleListProps {
  onAddModule: () => void;
  onEditModule?: (module: Module) => void;
  onDeleteModule?: (moduleId: string) => void;
  onAddLesson?: (moduleId: string) => void;
  onEditLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({ 
  onAddModule, 
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson
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
          <ModuleItem
            key={module.id}
            module={module}
            index={index}
            isExpanded={expandedModules.has(module.id)}
            onToggleExpand={() => toggleModule(module.id)}
            onEdit={onEditModule ? () => onEditModule(module) : undefined}
            onDelete={onDeleteModule ? () => onDeleteModule(module.id) : undefined}
            onAddLesson={onAddLesson ? () => onAddLesson(module.id) : undefined}
            onEditLesson={onEditLesson}
            onDeleteLesson={onDeleteLesson}
          />
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
