import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { BookOpen, FileText, Video, Clock } from 'lucide-react';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Lesson } from '../../types';
import toast from 'react-hot-toast';
import './LessonEditorModal.css';

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  lesson?: Lesson; // undefined for create, defined for edit
  onSuccess?: () => void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  lesson,
  onSuccess
}) => {
  const { addLesson, updateLesson } = useCourseContent();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    duration: '',
    isRequired: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isEditMode = !!lesson;

  // Initialize form data when modal opens or lesson changes
  useEffect(() => {
    if (isOpen) {
      if (lesson) {
        setFormData({
          title: lesson.title || '',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          duration: lesson.duration ? String(lesson.duration) : '',
          isRequired: lesson.isRequired !== undefined ? lesson.isRequired : true
        });
      } else {
        setFormData({
          title: '',
          content: '',
          videoUrl: '',
          duration: '',
          isRequired: true
        });
      }
      setFormErrors({});
    }
  }, [isOpen, lesson]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Lesson title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Lesson title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Lesson title must not exceed 200 characters';
    }

    if (formData.content && formData.content.length > 5000) {
      errors.content = 'Content must not exceed 5000 characters';
    }

    // Validate video URL if provided
    if (formData.videoUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(formData.videoUrl.trim())) {
        errors.videoUrl = 'Video URL must be a valid URL starting with http:// or https://';
      }
    }

    // Validate duration if provided
    if (formData.duration.trim()) {
      const durationNum = parseInt(formData.duration, 10);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.duration = 'Duration must be a positive number';
      } else if (durationNum > 999) {
        errors.duration = 'Duration must not exceed 999 minutes';
      }
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
      const lessonData = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        duration: formData.duration.trim() ? parseInt(formData.duration, 10) : undefined,
        isRequired: formData.isRequired
      };

      if (isEditMode && lesson) {
        await updateLesson(lesson.id, lessonData);
        toast.success('Lesson updated successfully');
      } else {
        await addLesson(moduleId, lessonData);
        toast.success('Lesson created successfully');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} lesson`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      videoUrl: '',
      duration: '',
      isRequired: true
    });
    setFormErrors({});
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="lesson-editor-form">
        <div className="form-group">
          <Input
            label="Lesson Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Lesson 1.1: HTML Basics"
            error={formErrors.title}
            icon={<BookOpen size={18} />}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="input-label">
            <FileText size={18} />
            Content (Optional)
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Provide lesson content, instructions, or description..."
            rows={6}
            className={`form-textarea ${formErrors.content ? 'textarea-error' : ''}`}
            maxLength={5000}
          />
          {formErrors.content && (
            <span className="input-error-message">{formErrors.content}</span>
          )}
          <span className="input-hint">
            {formData.content.length}/5000 characters
          </span>
        </div>

        <div className="form-group">
          <Input
            label="Video URL (Optional)"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            error={formErrors.videoUrl}
            icon={<Video size={18} />}
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
            icon={<Clock size={18} />}
            min="1"
            max="999"
          />
        </div>

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
              Mark as required (students must complete this lesson)
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
            icon={<BookOpen size={18} />}
          >
            {isEditMode ? 'Save Changes' : 'Create Lesson'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LessonEditorModal;
