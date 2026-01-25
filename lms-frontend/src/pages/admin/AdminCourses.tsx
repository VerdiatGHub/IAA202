import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen,
    Search,
    PlusCircle,
    RefreshCw,
    Trash2,
    Calendar,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Edit
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { getCourses, deleteCourse } from '../../services/courseService';
import type { Course } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import './AdminCourses.css';

export const AdminCourses: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (err) {
            toast.error('Failed to load courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        setDeletingCourseId(courseId);
        try {
            await deleteCourse(courseId);
            toast.success('Course deleted successfully');
            fetchCourses();
        } catch (err) {
            toast.error('Failed to delete course');
        } finally {
            setDeletingCourseId(null);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    return (
        <div className="admin-courses animate-fadeIn">
            <div className="page-header">
                <div className="page-title-group">
                    <h1 className="page-title">Course Management</h1>
                    <p className="page-subtitle">View and manage all courses in the system</p>
                </div>
                <Link to="/instructor/courses/new">
                    <Button
                        variant="primary"
                        icon={<PlusCircle size={18} />}
                    >
                        Create New Course
                    </Button>
                </Link>
            </div>

            <div className="controls-section">
                <div className="search-filter-group">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input
                            placeholder="Search by title or instructor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <Button
                    variant="ghost"
                    icon={<RefreshCw size={18} />}
                    onClick={fetchCourses}
                    loading={loading}
                    title="Refresh list"
                >
                    Refresh
                </Button>
            </div>

            <div className="courses-table-container">
                <div className="table-header">
                    <span className="col-course">Course</span>
                    <span className="col-instructor">Instructor</span>
                    <span className="col-level">Level</span>
                    <span className="col-status">Status</span>
                    <span className="col-stats">Stats</span>
                    <span className="col-date">Created</span>
                    <span className="col-actions">Actions</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="animate-spin">
                            <RefreshCw size={32} />
                        </div>
                        <p>Loading courses...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>No courses found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredCourses.map((course, index) => (
                        <div
                            key={course.id}
                            className="table-row animate-slideUp"
                            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                        >
                            <div className="col-course">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="course-thumbnail" />
                                ) : (
                                    <div className="course-thumbnail-placeholder">
                                        <BookOpen size={20} />
                                    </div>
                                )}
                                <div className="course-info">
                                    <span className="course-title" title={course.title}>{course.title}</span>
                                    <span className="course-category">{course.category || 'Uncategorized'}</span>
                                </div>
                            </div>

                            <div className="col-instructor">
                                <div className="instructor-avatar">
                                    {course.instructor?.fullName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="instructor-name">{course.instructor?.fullName || 'Unknown'}</span>
                            </div>

                            <div className="col-level">
                                {course.level || '-'}
                            </div>

                            <div className="col-status">
                                <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                    {course.isPublished ? (
                                        <><CheckCircle size={12} /> Published</>
                                    ) : (
                                        <><XCircle size={12} /> Draft</>
                                    )}
                                </span>
                            </div>

                            <div className="col-stats">
                                <span className="stat-item" title="Enrollments">
                                    <Users size={12} /> {course.enrollmentCount || 0}
                                </span>
                                <span className="stat-item" title="Lessons">
                                    <FileText size={12} /> {course.lessonCount || 0}
                                </span>
                            </div>

                            <div className="col-date">
                                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                {formatDate(course.createdAt)}
                            </div>

                            <div className="col-actions">
                                <Link to={`/instructor/courses/${course.id}/edit`}>
                                    <button
                                        className="action-btn edit"
                                        title="Edit Course"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </Link>
                                <button
                                    className="action-btn danger"
                                    title="Delete Course"
                                    onClick={() => handleDeleteCourse(course.id)}
                                    disabled={deletingCourseId === course.id}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
