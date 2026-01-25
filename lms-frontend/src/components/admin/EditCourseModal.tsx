import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { updateCourse, getCourseById } from '../../services/courseService';
import toast from 'react-hot-toast';
import './EditCourseModal.css';

interface EditCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onSuccess: () => void;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
    isOpen,
    onClose,
    courseId,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [fetchingCourse, setFetchingCourse] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        isPublished: false,
        isPublic: true
    });

    useEffect(() => {
        if (isOpen && courseId) {
            fetchCourse();
        }
    }, [isOpen, courseId]);

    const fetchCourse = async () => {
        setFetchingCourse(true);
        try {
            const course = await getCourseById(courseId);
            setFormData({
                title: course.title || '',
                description: course.description || '',
                category: course.category || '',
                level: course.level || 'beginner',
                isPublished: course.isPublished || false,
                isPublic: course.isPublic !== undefined ? course.isPublic : true
            });
        } catch (error) {
            toast.error('Failed to load course details');
            console.error(error);
        } finally {
            setFetchingCourse(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Course title is required');
            return;
        }

        setLoading(true);
        try {
            await updateCourse(courseId, formData);
            toast.success('Course updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update course');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Course">
            {fetchingCourse ? (
                <div className="loading-container">
                    <p>Loading course details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="edit-course-form">
                    <div className="form-group">
                        <label htmlFor="title">Course Title *</label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Introduction to Web Development"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what students will learn..."
                            rows={4}
                            className="form-textarea"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <Input
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g., Programming"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="level">Level</label>
                            <select
                                id="level"
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span>Published (visible to students)</span>
                        </label>
                        <p className="field-hint">If unchecked, course will be in draft mode</p>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span>Public (anyone can enroll)</span>
                        </label>
                        <p className="field-hint">If unchecked, only invited students can access this course</p>
                    </div>

                    <div className="modal-actions">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
