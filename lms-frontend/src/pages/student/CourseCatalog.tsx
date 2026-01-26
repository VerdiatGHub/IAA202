import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Grid,
    List,
    Star,
    Clock,
    Users,
    BookOpen,
    Play,
    ChevronDown,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import { courseService } from '../../services/courseService';
import type { Course } from '../../types';
import './CourseCatalog.css';

const categories = ['All', 'Development', 'Data Science', 'Design', 'Marketing', 'Business'];
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const sortOptions = ['Most Popular', 'Highest Rated', 'Newest', 'Title A-Z'];

export const CourseCatalog: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All Levels');
    const [sortBy, setSortBy] = useState('Most Popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch courses on mount
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await courseService.getPublishedCourses();
                setCourses(data);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        let result = [...courses];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (course) =>
                    course.title.toLowerCase().includes(query) ||
                    (course.description && course.description.toLowerCase().includes(query)) ||
                    (course.instructor && course.instructor.fullName && course.instructor.fullName.toLowerCase().includes(query))
            );
        }

        // Category filter
        if (selectedCategory !== 'All') {
            result = result.filter((course) => course.category === selectedCategory);
        }

        // Level filter
        if (selectedLevel !== 'All Levels') {
            result = result.filter((course) => course.level === selectedLevel);
        }

        // Sort
        switch (sortBy) {
            case 'Most Popular':
                result.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
                break;
            case 'Highest Rated':
                // For now, sort by enrollment count as we don't have ratings yet
                result.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
                break;
            case 'Newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'Title A-Z':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        return result;
    }, [courses, searchQuery, selectedCategory, selectedLevel, sortBy]);

    if (loading) {
        return <Loading message="Loading courses..." />;
    }

    return (
        <div className="course-catalog">
            {/* Header */}
            <section className="catalog-header animate-slideUp">
                <div className="header-content">
                    <h1 className="catalog-title">Explore Courses</h1>
                    <p className="catalog-subtitle">
                        Discover {courses.length}+ courses to boost your skills and career
                    </p>
                </div>

                {/* Search Bar */}
                <div className="search-container">
                    <Input
                        placeholder="Search courses, instructors, topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={<Search size={20} />}
                        className="search-input"
                    />
                </div>
            </section>

            {/* Filters Bar */}
            <section className="filters-bar">
                <div className="filters-left">
                    <button
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filters
                        <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
                    </button>

                    <div className="category-pills">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filters-right">
                    <span className="results-count">{filteredCourses.length} courses</span>

                    <div className="sort-dropdown">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            {sortOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Expanded Filters */}
            {showFilters && (
                <section className="expanded-filters animate-slideDown">
                    <div className="filter-group">
                        <label className="filter-label">Level</label>
                        <div className="filter-options">
                            {levels.map((level) => (
                                <button
                                    key={level}
                                    className={`filter-option ${selectedLevel === level ? 'active' : ''}`}
                                    onClick={() => setSelectedLevel(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Course Grid/List */}
            <section className={`courses-container ${viewMode}`}>
                {filteredCourses.length === 0 ? (
                    <div className="no-results">
                        <BookOpen size={48} />
                        <h3>No courses found</h3>
                        <p>Try adjusting your search or filters</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('All');
                                setSelectedLevel('All Levels');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    filteredCourses.map((course, index) => (
                        <Link
                            to={`/student/courses/${course.id}`}
                            key={course.id}
                            className="course-link"
                        >
                            <Card
                                className={`course-card animate-slideUp`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                padding="none"
                            >
                                <div className="course-thumbnail">
                                    <img 
                                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'} 
                                        alt={course.title} 
                                    />
                                    {(course.enrollmentCount || 0) > 5 && (
                                        <span className="bestseller-badge">Popular</span>
                                    )}
                                    <div className="thumbnail-overlay">
                                        <Button variant="primary" size="sm" icon={<Play size={14} />}>
                                            Preview
                                        </Button>
                                    </div>
                                </div>

                                <div className="course-content">
                                    <div className="course-category">
                                        <span className="category-tag">{course.category || 'General'}</span>
                                        <span className="level-tag">{course.level || 'Beginner'}</span>
                                    </div>

                                    <h3 className="course-title">{course.title}</h3>

                                    {viewMode === 'list' && course.description && (
                                        <p className="course-description">{course.description}</p>
                                    )}

                                    <p className="course-instructor">
                                        {course.instructor?.fullName || 'Instructor'}
                                    </p>

                                    <div className="course-stats">
                                        <div className="rating">
                                            <Star size={14} fill="currentColor" />
                                            <span className="rating-value">4.8</span>
                                            <span className="rating-count">(0)</span>
                                        </div>
                                    </div>

                                    <div className="course-meta">
                                        <span className="meta-item">
                                            <Clock size={14} />
                                            {course.duration || 'Self-paced'}
                                        </span>
                                        <span className="meta-item">
                                            <BookOpen size={14} />
                                            {course.lessonCount || 0} lessons
                                        </span>
                                        <span className="meta-item">
                                            <Users size={14} />
                                            {(course.enrollmentCount || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="course-footer">
                                        <span className="course-price">Free</span>
                                        <Button variant="primary" size="sm">
                                            Enroll Now
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                )}
            </section>
        </div>
    );
};

export default CourseCatalog;
