import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Video, FileText, ClipboardList, FileCheck, Paperclip, Link as LinkIcon } from 'lucide-react';
import { useCourseContent } from '../../contexts/useCourseContent';
import { QuizBuilder } from './QuizBuilder';
import type { ContentItem, ContentType } from '../../types';
// import toast from 'react-hot-toast'; // TODO: Add toast notifications
import './ContentEditorModal.css';

interface ContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  contentItem?: ContentItem; // undefined for create, defined for edit
  onSuccess?: () => void;
}

/**
 * ContentEditorModal Component
 * 
 * Modal for creating/editing content items with type-specific forms:
 * - Content type selector (for create mode)
 * - Render type-specific forms (VideoForm, TextForm, QuizForm, AssignmentForm, ResourceForm)
 * - Validation for each content type
 * - Required/optional toggle
 * 
 * Validates Requirements: 3.1, 4.1, 5.1, 6.1, 7.1
 */
export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  contentItem,
  onSuccess
}) => {
  const { addContentItem, updateContentItem } = useCourseContent();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentType>('video');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isRequired: true,
    // Video fields
    videoUrl: '',
    duration: '',
    // Text fields
    textContent: '',
    // Quiz fields
    quizTitle: '',
    quizTimeLimit: '',
    quizQuestions: [] as Array<{
      id: string;
      questionText: string;
      options: string[];
      correctAnswer: number;
      points: number;
    }>,
    // Assignment fields
    assignmentDescription: '',
    assignmentDueDate: '',
    assignmentMaxPoints: '',
    // Resource fields
    resourceType: 'link' as 'file' | 'link',
    resourceUrl: '',
    filePath: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isEditMode = !!contentItem;

  // Initialize form data when modal opens or contentItem changes
  useEffect(() => {
    if (isOpen) {
      if (contentItem) {
        setSelectedType(contentItem.contentType);
        setFormData({
          title: contentItem.title || '',
          description: contentItem.description || '',
          isRequired: contentItem.isRequired !== undefined ? contentItem.isRequired : true,
          videoUrl: contentItem.videoUrl || '',
          duration: contentItem.duration ? String(contentItem.duration) : '',
          textContent: contentItem.textContent || '',
          quizTitle: '',
          quizTimeLimit: '',
          quizQuestions: [],
          assignmentDescription: '',
          assignmentDueDate: '',
          assignmentMaxPoints: '',
          resourceType: contentItem.resourceType || 'link',
          resourceUrl: contentItem.resourceUrl || '',
          filePath: contentItem.filePath || ''
        });
      } else {
        setSelectedType('video');
        setFormData({
          title: '',
          description: '',
          isRequired: true,
          videoUrl: '',
          duration: '',
          textContent: '',
          quizTitle: '',
          quizTimeLimit: '',
          quizQuestions: [],
          assignmentDescription: '',
          assignmentDueDate: '',
          assignmentMaxPoints: '',
          resourceType: 'link',
          resourceUrl: '',
          filePath: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, contentItem]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Common validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
    }

    // Type-specific validation
    switch (selectedType) {
      case 'video':
        if (!formData.videoUrl.trim()) {
          errors.videoUrl = 'Video URL is required';
        } else {
          const urlPattern = /^https?:\/\/.+/i;
          if (!urlPattern.test(formData.videoUrl.trim())) {
            errors.videoUrl = 'Video URL must be a valid URL starting with http:// or https://';
          }
        }
        if (formData.duration.trim()) {
          const durationNum = parseInt(formData.duration, 10);
          if (isNaN(durationNum) || durationNum < 1) {
            errors.duration = 'Duration must be a positive number';
          } else if (durationNum > 999) {
            errors.duration = 'Duration must not exceed 999 minutes';
          }
        }
        break;

      case 'text':
        if (!formData.textContent.trim()) {
          errors.textContent = 'Text content is required';
        } else if (formData.textContent.length > 10000) {
          errors.textContent = 'Text content must not exceed 10000 characters';
        }
        break;

      case 'quiz':
        if (formData.quizQuestions.length === 0) {
          errors.quiz = 'At least one question is required';
        } else {
          // Validate each question
          formData.quizQuestions.forEach((q, index) => {
            if (!q.questionText.trim()) {
              errors[`question-${index}`] = `Question ${index + 1} text is required`;
            }
            if (q.options.some(opt => !opt.trim())) {
              errors[`question-${index}-options`] = `All options for question ${index + 1} must be filled`;
            }
          });
        }
        break;

      case 'assignment':
        // Assignment inline creation - no validation needed here
        // Will be handled by assignment builder in future
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const baseData = {
        contentType: selectedType,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        isRequired: formData.isRequired
      };

      let contentData: any = { ...baseData };

      // Add type-specific fields
      switch (selectedType) {
        case 'video':
          contentData.videoUrl = formData.videoUrl.trim();
          contentData.duration = formData.duration.trim() ? parseInt(formData.duration, 10) : undefined;
          break;
        case 'text':
          contentData.textContent = formData.textContent.trim();
          break;
        case 'quiz':
          contentData.quizData = {
            title: formData.title.trim(),
            timeLimit: formData.quizTimeLimit ? parseInt(formData.quizTimeLimit, 10) : null,
            questions: formData.quizQuestions.map(q => ({
              questionText: q.questionText.trim(),
              options: q.options.map(opt => opt.trim()),
              correctAnswer: q.correctAnswer,
              points: q.points
            }))
          };
          break;
        case 'assignment':
          contentData.assignmentData = {
            description: formData.assignmentDescription?.trim() || '',
            dueDate: formData.assignmentDueDate || null,
            maxPoints: formData.assignmentMaxPoints ? parseInt(formData.assignmentMaxPoints, 10) : null
          };
          break;
      }

      if (isEditMode && contentItem) {
        await updateContentItem(contentItem.id, contentData);
      } else {
        await addContentItem(lessonId, contentData);
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      // Error is already handled and toasted in the context
      console.error('Error saving content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType('video');
    setFormData({
      title: '',
      description: '',
      isRequired: true,
      videoUrl: '',
      duration: '',
      textContent: '',
      quizTitle: '',
      quizTimeLimit: '',
      quizQuestions: [],
      assignmentDescription: '',
      assignmentDueDate: '',
      assignmentMaxPoints: '',
      resourceType: 'link',
      resourceUrl: '',
      filePath: ''
    });
    setFormErrors({});
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: ContentType) => {
    setSelectedType(type);
    setFormErrors({});
  };

  const renderTypeSelector = () => {
    if (isEditMode) {
      return null; // Can't change type in edit mode
    }

    const contentTypes: Array<{ type: ContentType; label: string; icon: React.ReactNode }> = [
      { type: 'video', label: 'Video', icon: <Video size={20} /> },
      { type: 'text', label: 'Text', icon: <FileText size={20} /> },
      { type: 'quiz', label: 'Quiz', icon: <ClipboardList size={20} /> },
      { type: 'assignment', label: 'Assignment', icon: <FileCheck size={20} /> }
    ];

    return (
      <div className="content-type-selector">
        <label className="input-label">Content Type</label>
        <div className="type-buttons">
          {contentTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              className={`type-button ${selectedType === type ? 'active' : ''}`}
              onClick={() => handleTypeChange(type)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderVideoForm = () => (
    <>
      <div className="form-group">
        <Input
          label="Video URL"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          placeholder="https://www.youtube.com/watch?v=..."
          error={formErrors.videoUrl}
          icon={<Video size={18} />}
          required
        />
      </div>
      <div className="form-group">
        <Input
          label="Duration (Optional)"
          name="duration"
          type="number"
          value={formData.duration}
          onChange={handleChange}
          placeholder="Duration in minutes"
          error={formErrors.duration}
          icon={<Video size={18} />}
          min="1"
          max="999"
        />
      </div>
    </>
  );

  const renderTextForm = () => (
    <div className="form-group">
      <label htmlFor="textContent" className="input-label">
        <FileText size={18} />
        Text Content
      </label>
      <textarea
        id="textContent"
        name="textContent"
        value={formData.textContent}
        onChange={handleChange}
        placeholder="Enter the text content for this lesson..."
        rows={10}
        className={`form-textarea ${formErrors.textContent ? 'textarea-error' : ''}`}
        maxLength={10000}
        required
      />
      {formErrors.textContent && (
        <span className="input-error-message">{formErrors.textContent}</span>
      )}
      <span className="input-hint">
        {formData.textContent.length}/10000 characters
      </span>
    </div>
  );

  const renderQuizForm = () => (
    <>
      <div className="form-group">
        <Input
          label="Time Limit (Optional)"
          name="quizTimeLimit"
          type="number"
          value={formData.quizTimeLimit}
          onChange={handleChange}
          placeholder="Time limit in minutes"
          icon={<ClipboardList size={18} />}
          min="1"
        />
        <span className="input-hint">
          Leave empty for no time limit
        </span>
      </div>
      
      <QuizBuilder
        questions={formData.quizQuestions}
        onChange={(questions) => setFormData(prev => ({ ...prev, quizQuestions: questions }))}
      />
      
      {formErrors.quiz && (
        <div className="form-error-message">{formErrors.quiz}</div>
      )}
    </>
  );

  const renderAssignmentForm = () => (
    <>
      <div className="form-group">
        <label htmlFor="assignmentDescription" className="input-label">
          <FileCheck size={18} />
          Assignment Instructions
        </label>
        <textarea
          id="assignmentDescription"
          name="assignmentDescription"
          value={formData.assignmentDescription || ''}
          onChange={handleChange}
          placeholder="Enter assignment instructions and requirements..."
          rows={8}
          className="form-textarea"
        />
        <span className="input-hint">
          Provide detailed instructions for students
        </span>
      </div>
      
      <div className="form-group">
        <Input
          label="Due Date (Optional)"
          name="assignmentDueDate"
          type="date"
          value={formData.assignmentDueDate || ''}
          onChange={handleChange}
          icon={<FileCheck size={18} />}
        />
      </div>
      
      <div className="form-group">
        <Input
          label="Max Points (Optional)"
          name="assignmentMaxPoints"
          type="number"
          value={formData.assignmentMaxPoints || ''}
          onChange={handleChange}
          placeholder="100"
          icon={<FileCheck size={18} />}
          min="1"
        />
      </div>
    </>
  );

  const renderResourceForm = () => (
    <>
      <div className="form-group">
        <label className="input-label">Resource Type</label>
        <div className="resource-type-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="resourceType"
              value="link"
              checked={formData.resourceType === 'link'}
              onChange={handleChange}
              className="radio-input"
            />
            <span className="radio-text">External Link</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="resourceType"
              value="file"
              checked={formData.resourceType === 'file'}
              onChange={handleChange}
              className="radio-input"
            />
            <span className="radio-text">File</span>
          </label>
        </div>
      </div>

      {formData.resourceType === 'link' ? (
        <div className="form-group">
          <Input
            label="Resource URL"
            name="resourceUrl"
            value={formData.resourceUrl}
            onChange={handleChange}
            placeholder="https://example.com/resource.pdf"
            error={formErrors.resourceUrl}
            icon={<LinkIcon size={18} />}
            required
          />
        </div>
      ) : (
        <div className="form-group">
          <Input
            label="File Path"
            name="filePath"
            value={formData.filePath}
            onChange={handleChange}
            placeholder="/uploads/resources/document.pdf"
            error={formErrors.filePath}
            icon={<Paperclip size={18} />}
            required
          />
          <span className="input-hint">
            Enter the path to the uploaded file
          </span>
        </div>
      )}
    </>
  );

  const renderTypeSpecificForm = () => {
    switch (selectedType) {
      case 'video':
        return renderVideoForm();
      case 'text':
        return renderTextForm();
      case 'quiz':
        return renderQuizForm();
      case 'assignment':
        return renderAssignmentForm();
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    if (isEditMode) {
      return `Edit ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Content`;
    }
    return 'Add Content Item';
  };

  const getContentTypeIcon = () => {
    switch (selectedType) {
      case 'video':
        return <Video size={18} />;
      case 'text':
        return <FileText size={18} />;
      case 'quiz':
        return <ClipboardList size={18} />;
      case 'assignment':
        return <FileCheck size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={getModalTitle()}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="content-editor-form">
        {renderTypeSelector()}

        <div className="form-group">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={`Enter ${selectedType} title`}
            error={formErrors.title}
            icon={getContentTypeIcon()}
            required
            autoFocus={isEditMode}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="input-label">
            <FileText size={18} />
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a brief description..."
            rows={3}
            className={`form-textarea ${formErrors.description ? 'textarea-error' : ''}`}
            maxLength={1000}
          />
          {formErrors.description && (
            <span className="input-error-message">{formErrors.description}</span>
          )}
          <span className="input-hint">
            {formData.description.length}/1000 characters
          </span>
        </div>

        {renderTypeSpecificForm()}

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isRequired"
              checked={formData.isRequired}
              onChange={handleChange}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              Mark as required (students must complete this content)
            </span>
          </label>
        </div>

        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={getContentTypeIcon()}
          >
            {isEditMode ? 'Save Changes' : 'Add Content'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContentEditorModal;
