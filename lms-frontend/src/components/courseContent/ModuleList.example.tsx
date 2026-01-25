/**
 * Example usage of ModuleList component
 * 
 * This file demonstrates how to use the ModuleList component
 * within a CourseContentProvider context.
 */

import React from 'react';
import { CourseContentProvider } from '../../contexts/CourseContentContext';
import { ModuleList } from './ModuleList';

export const ModuleListExample: React.FC = () => {
  const courseId = 'example-course-id';

  const handleAddModule = () => {
    console.log('Add module clicked');
    // Open modal or navigate to add module form
  };

  return (
    <CourseContentProvider courseId={courseId}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <ModuleList onAddModule={handleAddModule} />
      </div>
    </CourseContentProvider>
  );
};

export default ModuleListExample;
