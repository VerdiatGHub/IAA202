import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Users,
    DollarSign,
    Eye,
    Search,
    Filter,
    Grid,
    List,
    TrendingUp,
    Clock,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../contexts/useAuth';
import toast from 'react-hot-toast';
import './InstructorCourses.css';

interface Course {
    id: string;
    title: string;
    thumbnailUrl?: string;
    enrollmentCount?: number;
    pendingSubmissions?: number;
    category?: string;
    level?: string;
    duration?: string;
    isPublished: boolean;
    updatedAt?: string;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'published' | 'draft';

export const InstructorCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCourses();
    }, [user]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            // Get courses for current instructor
            const coursesData = await courseService.getCourses({
                instructorId: user?.id
            });
            setCourses(coursesData);
        } catch (error) {
            console.error('Error loading courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter((course) => {
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'published' && course.isPublished) ||
            (filterStatus === 'draft' && !course.isPublished);
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: courses.length,
        published: courses.filter((c) => c.isPublished).length,
        draft: courses.filter((c) => !c.isPublished).length,
        totalStudents: courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0),
        totalRevenue: 0, // Revenue calculation would need additional data
    };

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="instructor-courses">
            {/* Header */}
            <div className="courses-header">
                <div className="header-content">
                    <h1 className="page-title">My Courses</h1>
                    <p className="page-subtitle">View and manage your assigned courses</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="courses-stats">
                <Card className="stat-card">
                    <div className="stat-icon primary">
                        <BookOpen size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Courses</span>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon success">
                        <Users size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalStudents.toLocaleString()}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon warning">
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">N/A</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon info">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.published}/{stats.total}</span>
                        <span className="stat-label">Published</span>
                    </div>
                </Card>
            </div>

            {/* Filters and View Controls */}
            <div className="courses-controls">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <div className="status-filter">
                        <Filter size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        >
                            <option value="all">All Courses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Courses Display */}
            {filteredCourses.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No courses found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className={`courses-${viewMode}`}>
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="course-card">
                            {viewMode === 'grid' ? (
                                <>
                                    <div className="course-thumbnail">
                                        <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'} alt={course.title} />
                                        <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                            {course.isPublished ? 'published' : 'draft'}
                                        </span>
                                    </div>
                                    <div className="course-content">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p className="course-category">{course.category || 'General'} • {course.level || 'All Levels'}</p>
                                        
                                        <div className="course-meta">
                                            <span className="meta-item">
                                                <Users size={14} />
                                                {course.enrollmentCount?.toLocaleString() || 0}
                                            </span>
                                            <span className="meta-item">
                                                <Clock size={14} />
                                                {course.duration || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="course-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">Students</span>
                                                <span className="stat-value">{course.enrollmentCount || 0}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Pending</span>
                                                <span className="stat-value pending-count">{course.pendingSubmissions || 0}</span>
                                            </div>
                                        </div>

                                        <div className="course-actions">
                                            <Link to={`/instructor/courses/${course.id}`}>
                                                <Button variant="primary" size="sm" icon={<Eye size={16} />}>
                                                    View
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="course-footer">
                                            <span className="updated-time">Updated {getRelativeTime(course.updatedAt)}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="course-list-item">
                                    <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'} alt={course.title} className="list-thumbnail" />
                                    <div className="list-content">
                                        <div className="list-header">
                                            <div>
                                                <h3 className="course-title">{course.title}</h3>
                                                <p className="course-category">{course.category || 'General'} • {course.level || 'All Levels'}</p>
                                            </div>
                                            <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                                {course.isPublished ? 'published' : 'draft'}
                                            </span>
                                        </div>
                                        <div className="list-meta">
                                            <span className="meta-item">
                                                <Users size={14} />
                                                {course.enrollmentCount?.toLocaleString() || 0} students
                                            </span>
                                            <span className="meta-item">
                                                <Clock size={14} />
                                                {course.duration || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="list-actions">
                                        <Link to={`/instructor/courses/${course.id}`}>
                                            <Button variant="primary" size="sm" icon={<Eye size={16} />}>
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorCourses;
