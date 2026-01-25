/**
 * Example usage of ModuleList component with ModuleEditorModal
 * 
 * This file demonstrates how to use the ModuleList component
 * within a CourseContentProvider context, including the
 * ModuleEditorModal for creating and editing modules.
 */

import React, { useState } from 'react';
import { CourseContentProvider } from '../../contexts/CourseContentContext';
import { ModuleList } from './ModuleList';
import { ModuleEditorModal } from './ModuleEditorModal';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Module } from '../../types';

const ModuleListWithModal: React.FC = () => {
  const { deleteModule, refreshContent } = useCourseContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);

  const handleAddModule = () => {
    setEditingModule(undefined);
    setIsModalOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsModalOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule(moduleId);
    } catch (error) {
      console.error('Failed to delete module:', error);
    }
  };

  const handleModalSuccess = () => {
    // Optionally refresh content after successful create/update
    refreshContent();
  };

  const handleAddLesson = (moduleId: string) => {
    console.log('Add lesson to module:', moduleId);
    // TODO: Implement lesson creation modal
  };

  return (
    <>
      <ModuleList 
        onAddModule={handleAddModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onAddLesson={handleAddLesson}
      />
      
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        module={editingModule}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export const ModuleListExample: React.FC = () => {
  const courseId = 'example-course-id';

  return (
    <CourseContentProvider courseId={courseId}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <ModuleListWithModal />
      </div>
    </CourseContentProvider>
  );
};

export default ModuleListExample;
