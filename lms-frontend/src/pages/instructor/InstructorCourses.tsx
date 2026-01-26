import React, { useState } from 'react';
import {
    BookOpen,
    Users,
    Star,
    DollarSign,
    Eye,
    MoreVertical,
    Search,
    Filter,
    Grid,
    List,
    TrendingUp,
    Clock,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './InstructorCourses.css';

// Mock data - same as dashboard
const mockCourses = [
    {
        id: '1',
        title: 'Web Development Fundamentals',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        students: 1542,
        rating: 4.8,
        revenue: 4680,
        status: 'published',
        lastUpdated: '2 days ago',
        category: 'Web Development',
        level: 'Beginner',
        lessons: 24,
        duration: '12 hours',
    },
    {
        id: '2',
        title: 'Advanced React Patterns',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
        students: 876,
        rating: 4.9,
        revenue: 3240,
        status: 'published',
        lastUpdated: '1 week ago',
        category: 'Frontend',
        level: 'Advanced',
        lessons: 18,
        duration: '8 hours',
    },
    {
        id: '3',
        title: 'Node.js Backend Development',
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
        students: 429,
        rating: 4.7,
        revenue: 2130,
        status: 'draft',
        lastUpdated: '3 days ago',
        category: 'Backend',
        level: 'Intermediate',
        lessons: 20,
        duration: '10 hours',
    },
    {
        id: '4',
        title: 'Python for Data Science',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
        students: 1203,
        rating: 4.6,
        revenue: 3890,
        status: 'published',
        lastUpdated: '5 days ago',
        category: 'Data Science',
        level: 'Intermediate',
        lessons: 30,
        duration: '15 hours',
    },
    {
        id: '5',
        title: 'Mobile App Development with React Native',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
        students: 654,
        rating: 4.8,
        revenue: 2450,
        status: 'published',
        lastUpdated: '1 week ago',
        category: 'Mobile',
        level: 'Intermediate',
        lessons: 22,
        duration: '11 hours',
    },
    {
        id: '6',
        title: 'DevOps Essentials',
        thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400',
        students: 321,
        rating: 4.5,
        revenue: 1560,
        status: 'draft',
        lastUpdated: '2 weeks ago',
        category: 'DevOps',
        level: 'Advanced',
        lessons: 16,
        duration: '9 hours',
    },
];

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'published' | 'draft';

export const InstructorCourses: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCourses = mockCourses.filter((course) => {
        const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: mockCourses.length,
        published: mockCourses.filter((c) => c.status === 'published').length,
        draft: mockCourses.filter((c) => c.status === 'draft').length,
        totalStudents: mockCourses.reduce((sum, c) => sum + c.students, 0),
        totalRevenue: mockCourses.reduce((sum, c) => sum + c.revenue, 0),
    };

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
                        <span className="stat-value">${stats.totalRevenue.toLocaleString()}</span>
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
                                        <img src={course.thumbnail} alt={course.title} />
                                        <span className={`status-badge ${course.status}`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <div className="course-content">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p className="course-category">{course.category} • {course.level}</p>
                                        
                                        <div className="course-meta">
                                            <span className="meta-item">
                                                <Users size={14} />
                                                {course.students.toLocaleString()}
                                            </span>
                                            <span className="meta-item">
                                                <Star size={14} fill="currentColor" />
                                                {course.rating}
                                            </span>
                                            <span className="meta-item">
                                                <Clock size={14} />
                                                {course.duration}
                                            </span>
                                        </div>

                                        <div className="course-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">Revenue</span>
                                                <span className="stat-value">${course.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Lessons</span>
                                                <span className="stat-value">{course.lessons}</span>
                                            </div>
                                        </div>

                                        <div className="course-actions">
                                            <Button variant="primary" size="sm" icon={<Eye size={16} />}>
                                                View
                                            </Button>
                                            <button className="more-btn">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>

                                        <div className="course-footer">
                                            <span className="updated-time">Updated {course.lastUpdated}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="course-list-item">
                                    <img src={course.thumbnail} alt={course.title} className="list-thumbnail" />
                                    <div className="list-content">
                                        <div className="list-header">
                                            <div>
                                                <h3 className="course-title">{course.title}</h3>
                                                <p className="course-category">{course.category} • {course.level}</p>
                                            </div>
                                            <span className={`status-badge ${course.status}`}>
                                                {course.status}
                                            </span>
                                        </div>
                                        <div className="list-meta">
                                            <span className="meta-item">
                                                <Users size={14} />
                                                {course.students.toLocaleString()} students
                                            </span>
                                            <span className="meta-item">
                                                <Star size={14} fill="currentColor" />
                                                {course.rating} rating
                                            </span>
                                            <span className="meta-item">
                                                <DollarSign size={14} />
                                                ${course.revenue.toLocaleString()}
                                            </span>
                                            <span className="meta-item">
                                                <Clock size={14} />
                                                {course.lessons} lessons • {course.duration}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="list-actions">
                                        <Button variant="primary" size="sm" icon={<Eye size={16} />}>
                                            View
                                        </Button>
                                        <button className="more-btn">
                                            <MoreVertical size={16} />
                                        </button>
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
