import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { BookOpen, FileText } from 'lucide-react';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { Module } from '../../types';
// import toast from 'react-hot-toast'; // TODO: Add toast notifications
import './ModuleEditorModal.css';

interface ModuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  module?: Module; // undefined for create, defined for edit
  onSuccess?: () => void;
}

export const ModuleEditorModal: React.FC<ModuleEditorModalProps> = ({
  isOpen,
  onClose,
  module,
  onSuccess
}) => {
  const { addModule, updateModule } = useCourseContent();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isEditMode = !!module;

  // Initialize form data when modal opens or module changes
  useEffect(() => {
    if (isOpen) {
      if (module) {
        setFormData({
          title: module.title || '',
          description: module.description || ''
        });
      } else {
        setFormData({
          title: '',
          description: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, module]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Module title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Module title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Module title must not exceed 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
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
      const moduleData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined
      };

      if (isEditMode && module) {
        await updateModule(module.id, moduleData);
      } else {
        await addModule(moduleData);
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      // Error is already handled and toasted in the context
      console.error('Error saving module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: ''
    });
    setFormErrors({});
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      title={isEditMode ? 'Edit Module' : 'Create New Module'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="module-editor-form">
        <div className="form-group">
          <Input
            label="Module Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Week 1: Introduction to HTML"
            error={formErrors.title}
            icon={<BookOpen size={18} />}
            required
            autoFocus
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
            placeholder="Provide a brief description of what this module covers..."
            rows={4}
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
            {isEditMode ? 'Save Changes' : 'Create Module'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModuleEditorModal;
