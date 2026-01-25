import React, { useState } from 'react';
import { ChevronDown, Video, FileText, ClipboardList, FileCheck, Paperclip } from 'lucide-react';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Module, Lesson, ContentItem, ContentType } from '../../types';
import './StudentContentView.css';

interface StudentContentViewProps {
  courseId: string;
}

/**
 * StudentContentView Component
 * 
 * Displays course content in read-only format as students would see it.
 * 
 * Features:
 * - Displays modules, lessons, and content in read-only format (Requirement 11.2)
 * - Hides all editing controls (Requirement 11.2)
 * - Shows required/optional indicators (Requirement 11.4, 15.4)
 * - Displays content type icons (Requirement 15.5)
 * - Sorts by order_index (Requirement 11.3, 15.1, 15.2, 15.3)
 * 
 * Validates Requirements: 11.2, 11.3, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5
 */
export const StudentContentView: React.FC<StudentContentViewProps> = ({ courseId }) => {
  // courseId is passed for potential future use (e.g., analytics, direct API calls)
  // Currently, course data is accessed through CourseContentContext
  const { modules, loading, error } = useCourseContent();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Toggle module expansion
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

  // Toggle lesson expansion
  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  // Sort modules by orderIndex (Requirement 11.3, 15.1)
  const sortedModules = [...modules].sort((a, b) => a.orderIndex - b.orderIndex);

  // Loading state
  if (loading) {
    return (
      <div className="student-content-view">
        <div className="loading-state">
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="student-content-view">
        <div className="error-state">
          <p>Error loading course content: {error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedModules.length === 0) {
    return (
      <div className="student-content-view">
        <div className="empty-state">
          <p>No course content available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-view">
      <div className="modules-container">
        {sortedModules.map((module, moduleIndex) => (
          <StudentModuleItem
            key={module.id}
            module={module}
            moduleIndex={moduleIndex}
            isExpanded={expandedModules.has(module.id)}
            onToggle={() => toggleModule(module.id)}
            expandedLessons={expandedLessons}
            onToggleLesson={toggleLesson}
          />
        ))}
      </div>
    </div>
  );
};

interface StudentModuleItemProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  expandedLessons: Set<string>;
  onToggleLesson: (lessonId: string) => void;
}

/**
 * StudentModuleItem Component
 * 
 * Displays a module in read-only format without editing controls.
 * Validates Requirements: 11.2, 11.3, 15.1
 */
const StudentModuleItem: React.FC<StudentModuleItemProps> = ({
  module,
  moduleIndex,
  isExpanded,
  onToggle,
  expandedLessons,
  onToggleLesson,
}) => {
  // Sort lessons by orderIndex (Requirement 11.3, 15.2)
  const sortedLessons = module.lessons
    ? [...module.lessons].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  // Calculate total duration
  const totalDuration = sortedLessons.reduce((sum, lesson) => {
    return sum + (lesson.duration || 0);
  }, 0);

  const lessonCount = sortedLessons.length;

  return (
    <div className="student-module-item">
      <div className="student-module-header" onClick={onToggle}>
        <div className="student-module-info">
          <span className="student-module-number">Module {moduleIndex + 1}</span>
          <h3 className="student-module-title">{module.title}</h3>
          {module.description && (
            <p className="student-module-description">{module.description}</p>
          )}
        </div>
        <div className="student-module-meta">
          <span className="student-lesson-count">
            {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
          </span>
          {totalDuration > 0 && (
            <>
              <span className="meta-separator">•</span>
              <span className="student-module-duration">
                {totalDuration} {totalDuration === 1 ? 'min' : 'mins'}
              </span>
            </>
          )}
          <button
            className={`student-expand-button ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {isExpanded && sortedLessons.length > 0 && (
        <div className="student-module-content">
          <div className="student-lessons-list">
            {sortedLessons.map((lesson, lessonIndex) => (
              <StudentLessonItem
                key={lesson.id}
                lesson={lesson}
                lessonIndex={lessonIndex}
                isExpanded={expandedLessons.has(lesson.id)}
                onToggle={() => onToggleLesson(lesson.id)}
              />
            ))}
          </div>
        </div>
      )}

      {isExpanded && sortedLessons.length === 0 && (
        <div className="student-module-content">
          <div className="student-empty-state">
            <p>No lessons in this module yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface StudentLessonItemProps {
  lesson: Lesson;
  lessonIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * StudentLessonItem Component
 * 
 * Displays a lesson in read-only format with required/optional indicator.
 * Validates Requirements: 11.2, 11.3, 11.4, 15.2, 15.4
 */
const StudentLessonItem: React.FC<StudentLessonItemProps> = ({
  lesson,
  lessonIndex,
  isExpanded,
  onToggle,
}) => {
  // Sort content items by orderIndex (Requirement 11.3, 15.3)
  const sortedContentItems = lesson.contentItems
    ? [...lesson.contentItems].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const contentCount = sortedContentItems.length;

  return (
    <div className="student-lesson-item">
      <div className="student-lesson-header" onClick={onToggle}>
        <div className="student-lesson-info">
          <span className="student-lesson-number">Lesson {lessonIndex + 1}</span>
          <h4 className="student-lesson-title">{lesson.title}</h4>
          <div className="student-lesson-meta">
            <span className="student-content-count">
              {contentCount} {contentCount === 1 ? 'item' : 'items'}
            </span>
            {lesson.duration && (
              <>
                <span className="meta-separator">•</span>
                <span className="student-lesson-duration">
                  {lesson.duration} {lesson.duration === 1 ? 'min' : 'mins'}
                </span>
              </>
            )}
            {/* Required/Optional indicator (Requirement 11.4, 15.4) */}
            {lesson.isRequired !== undefined && (
              <span className={`student-lesson-badge ${lesson.isRequired ? 'required' : 'optional'}`}>
                {lesson.isRequired ? 'Required' : 'Optional'}
              </span>
            )}
          </div>
        </div>
        <button
          className={`student-expand-button ${isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isExpanded ? 'Collapse lesson' : 'Expand lesson'}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {isExpanded && sortedContentItems.length > 0 && (
        <div className="student-lesson-content">
          <div className="student-content-items-list">
            {sortedContentItems.map((contentItem) => (
              <StudentContentItemRow
                key={contentItem.id}
                contentItem={contentItem}
              />
            ))}
          </div>
        </div>
      )}

      {isExpanded && sortedContentItems.length === 0 && (
        <div className="student-lesson-content">
          <div className="student-empty-state">
            <p>No content items in this lesson yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface StudentContentItemRowProps {
  contentItem: ContentItem;
}

/**
 * StudentContentItemRow Component
 * 
 * Displays a content item in read-only format with type icon and required/optional indicator.
 * Validates Requirements: 11.2, 11.4, 15.4, 15.5
 */
const StudentContentItemRow: React.FC<StudentContentItemRowProps> = ({ contentItem }) => {
  return (
    <div className="student-content-item-row">
      <div className="student-content-item-info">
        {/* Content type icon (Requirement 15.5) */}
        <span className="student-content-type-icon" title={contentItem.contentType}>
          {getContentTypeIcon(contentItem.contentType)}
        </span>
        <span className="student-content-title">{contentItem.title}</span>
        {contentItem.duration && (
          <span className="student-content-duration">
            {contentItem.duration} {contentItem.duration === 1 ? 'min' : 'mins'}
          </span>
        )}
        {/* Required/Optional indicator (Requirement 11.4, 15.4) */}
        <span className={`student-content-badge ${contentItem.isRequired ? 'required' : 'optional'}`}>
          {contentItem.isRequired ? 'Required' : 'Optional'}
        </span>
      </div>
    </div>
  );
};

/**
 * Get icon component for content type
 * Validates Requirement: 15.5
 */
function getContentTypeIcon(contentType: ContentType): React.ReactNode {
  const iconSize = 18;
  const iconColor = '#6b7280';
  
  switch (contentType) {
    case 'video':
      return <Video size={iconSize} color={iconColor} />;
    case 'text':
      return <FileText size={iconSize} color={iconColor} />;
    case 'quiz':
      return <ClipboardList size={iconSize} color={iconColor} />;
    case 'assignment':
      return <FileCheck size={iconSize} color={iconColor} />;
    case 'resource':
      return <Paperclip size={iconSize} color={iconColor} />;
    default:
      return <FileText size={iconSize} color={iconColor} />;
  }
}

export default StudentContentView;
