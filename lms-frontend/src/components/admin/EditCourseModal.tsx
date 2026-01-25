import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { updateCourse, getCourseById } from '../../services/courseService';
import { CourseContentProvider } from '../../contexts/CourseContentContext';
import { CourseContentEditor } from '../courseContent/CourseContentEditor';
import toast from 'react-hot-toast';
import './EditCourseModal.css';

interface EditCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onSuccess: () => void;
}

type TabType = 'details' | 'lessons' | 'settings';

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
    isOpen,
    onClose,
    courseId,
    onSuccess
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [loading, setLoading] = useState(false);
    const [fetchingCourse, setFetchingCourse] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        isPublished: false
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
                isPublished: course.isPublished || false
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
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Course" size="xl">
            {fetchingCourse ? (
                <div className="loading-container">
                    <p>Loading course details...</p>
                </div>
            ) : (
                <div className="edit-course-modal-content">
                    {/* Tabs */}
                    <div className="course-tabs">
                        <button
                            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}
                            onClick={() => setActiveTab('lessons')}
                        >
                            Lessons
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'details' && (
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

                        {activeTab === 'lessons' && (
                            <div className="lessons-tab">
                                <CourseContentProvider courseId={courseId}>
                                    <CourseContentEditor />
                                </CourseContentProvider>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <form onSubmit={handleSubmit} className="edit-course-form">
                                <div className="form-group">
                                    <label htmlFor="isPublished">Course Status</label>
                                    <div className="toggle-group">
                                        <button
                                            type="button"
                                            className={`toggle-option ${formData.isPublished ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                                        >
                                            Published
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-option ${!formData.isPublished ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, isPublished: false }))}
                                        >
                                            Draft
                                        </button>
                                    </div>
                                    <p className="field-hint">Published courses are visible to students</p>
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
                    </div>
                </div>
            )}
        </Modal>
    );
};
