import React, { useState, useMemo } from 'react';
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
import './CourseCatalog.css';

// Mock course data
const mockCourses = [
    {
        id: '1',
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, and JavaScript from scratch. Build real-world projects and master modern web development.',
        instructor: 'Dr. Sarah Johnson',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        rating: 4.8,
        reviewCount: 1234,
        students: 15420,
        duration: '40 hours',
        lessons: 48,
        level: 'Beginner',
        category: 'Development',
        price: 0,
        isBestseller: true,
    },
    {
        id: '2',
        title: 'Python for Data Science',
        description: 'Master Python programming and data analysis with pandas, numpy, and matplotlib.',
        instructor: 'Prof. Michael Chen',
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
        rating: 4.9,
        reviewCount: 2156,
        students: 23100,
        duration: '52 hours',
        lessons: 65,
        level: 'Intermediate',
        category: 'Data Science',
        price: 0,
        isBestseller: true,
    },
    {
        id: '3',
        title: 'UI/UX Design Principles',
        description: 'Create stunning user interfaces and seamless user experiences with modern design methodologies.',
        instructor: 'Emily Rodriguez',
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        rating: 4.7,
        reviewCount: 876,
        students: 8900,
        duration: '28 hours',
        lessons: 32,
        level: 'Beginner',
        category: 'Design',
        price: 0,
        isBestseller: false,
    },
    {
        id: '4',
        title: 'React Advanced Patterns',
        description: 'Deep dive into React hooks, context, performance optimization, and advanced component patterns.',
        instructor: 'Alex Turner',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
        rating: 4.9,
        reviewCount: 543,
        students: 4500,
        duration: '35 hours',
        lessons: 42,
        level: 'Advanced',
        category: 'Development',
        price: 0,
        isBestseller: false,
    },
    {
        id: '5',
        title: 'Machine Learning Basics',
        description: 'Introduction to machine learning algorithms, from linear regression to neural networks.',
        instructor: 'Dr. Lisa Wang',
        thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
        rating: 4.8,
        reviewCount: 1890,
        students: 19200,
        duration: '60 hours',
        lessons: 78,
        level: 'Intermediate',
        category: 'Data Science',
        price: 0,
        isBestseller: true,
    },
    {
        id: '6',
        title: 'Digital Marketing Mastery',
        description: 'Learn SEO, social media marketing, and digital advertising strategies.',
        instructor: 'James Wilson',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        rating: 4.6,
        reviewCount: 654,
        students: 7800,
        duration: '24 hours',
        lessons: 28,
        level: 'Beginner',
        category: 'Marketing',
        price: 0,
        isBestseller: false,
    },
    {
        id: '7',
        title: 'Cloud Computing with AWS',
        description: 'Master Amazon Web Services and deploy scalable cloud applications.',
        instructor: 'David Kim',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
        rating: 4.7,
        reviewCount: 1234,
        students: 12000,
        duration: '45 hours',
        lessons: 55,
        level: 'Intermediate',
        category: 'Development',
        price: 0,
        isBestseller: false,
    },
    {
        id: '8',
        title: 'Mobile App Development',
        description: 'Build cross-platform mobile apps with React Native and Flutter.',
        instructor: 'Sophie Martin',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
        rating: 4.8,
        reviewCount: 987,
        students: 9500,
        duration: '50 hours',
        lessons: 60,
        level: 'Intermediate',
        category: 'Development',
        price: 0,
        isBestseller: true,
    },
];

const categories = ['All', 'Development', 'Data Science', 'Design', 'Marketing', 'Business'];
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const sortOptions = ['Most Popular', 'Highest Rated', 'Newest', 'Title A-Z'];

export const CourseCatalog: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All Levels');
    const [sortBy, setSortBy] = useState('Most Popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    const filteredCourses = useMemo(() => {
        let result = [...mockCourses];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (course) =>
                    course.title.toLowerCase().includes(query) ||
                    course.description.toLowerCase().includes(query) ||
                    course.instructor.toLowerCase().includes(query)
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
                result.sort((a, b) => b.students - a.students);
                break;
            case 'Highest Rated':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'Newest':
                result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                break;
            case 'Title A-Z':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        return result;
    }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

    return (
        <div className="course-catalog">
            {/* Header */}
            <section className="catalog-header animate-slideUp">
                <div className="header-content">
                    <h1 className="catalog-title">Explore Courses</h1>
                    <p className="catalog-subtitle">
                        Discover {mockCourses.length}+ courses to boost your skills and career
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
                                    <img src={course.thumbnail} alt={course.title} />
                                    {course.isBestseller && (
                                        <span className="bestseller-badge">Bestseller</span>
                                    )}
                                    <div className="thumbnail-overlay">
                                        <Button variant="primary" size="sm" icon={<Play size={14} />}>
                                            Preview
                                        </Button>
                                    </div>
                                </div>

                                <div className="course-content">
                                    <div className="course-category">
                                        <span className="category-tag">{course.category}</span>
                                        <span className="level-tag">{course.level}</span>
                                    </div>

                                    <h3 className="course-title">{course.title}</h3>

                                    {viewMode === 'list' && (
                                        <p className="course-description">{course.description}</p>
                                    )}

                                    <p className="course-instructor">{course.instructor}</p>

                                    <div className="course-stats">
                                        <div className="rating">
                                            <Star size={14} fill="currentColor" />
                                            <span className="rating-value">{course.rating}</span>
                                            <span className="rating-count">({course.reviewCount.toLocaleString()})</span>
                                        </div>
                                    </div>

                                    <div className="course-meta">
                                        <span className="meta-item">
                                            <Clock size={14} />
                                            {course.duration}
                                        </span>
                                        <span className="meta-item">
                                            <BookOpen size={14} />
                                            {course.lessons} lessons
                                        </span>
                                        <span className="meta-item">
                                            <Users size={14} />
                                            {course.students.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="course-footer">
                                        <span className="course-price">
                                            {course.price === 0 ? 'Free' : `$${course.price}`}
                                        </span>
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
