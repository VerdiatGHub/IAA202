/**
 * Example usage of ModuleItem component
 * 
 * This file demonstrates how to use the ModuleItem component
 * with sample data.
 */

import React, { useState } from 'react';
import { ModuleItem } from './ModuleItem';
import type { Module } from '../../types';

export const ModuleItemExample: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sampleModule: Module = {
    id: 'module-1',
    courseId: 'course-1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
    orderIndex: 0,
    lessonCount: 5,
    lessons: [
      {
        id: 'lesson-1',
        courseId: 'course-1',
        moduleId: 'module-1',
        title: 'HTML Basics',
        orderIndex: 0,
        duration: 30,
        isRequired: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lesson-2',
        courseId: 'course-1',
        moduleId: 'module-1',
        title: 'CSS Fundamentals',
        orderIndex: 1,
        duration: 45,
        isRequired: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lesson-3',
        courseId: 'course-1',
        moduleId: 'module-1',
        title: 'JavaScript Introduction',
        orderIndex: 2,
        duration: 60,
        isRequired: true,
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleEdit = () => {
    console.log('Edit module:', sampleModule.id);
  };

  const handleDelete = () => {
    console.log('Delete module:', sampleModule.id);
  };

  const handleAddLesson = () => {
    console.log('Add lesson to module:', sampleModule.id);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ModuleItem Component Example</h1>
      <p>This example shows a module with 3 lessons and a total duration of 135 minutes.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <ModuleItem
          module={sampleModule}
          index={0}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddLesson={handleAddLesson}
        />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Module without lessons</h2>
        <ModuleItem
          module={{
            ...sampleModule,
            id: 'module-2',
            title: 'Advanced Topics',
            description: 'Coming soon',
            lessons: [],
            lessonCount: 0,
          }}
          index={1}
          isExpanded={false}
          onToggleExpand={() => {}}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddLesson={handleAddLesson}
        />
      </div>
    </div>
  );
};

export default ModuleItemExample;
