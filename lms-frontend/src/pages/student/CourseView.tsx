import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Play,
    Clock,
    BookOpen,
    Users,
    Star,
    Award,
    CheckCircle,
    Lock,
    FileText,
    Video,
    Download,
    MessageSquare,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { CourseContentProvider } from '../../contexts/CourseContentContext';
import { StudentContentView } from '../../components/courseContent/StudentContentView';
import './CourseView.css';

// Type definitions
interface LessonItem {
    id: string;
    title: string;
    duration: string;
    type: string;
    completed: boolean;
    current?: boolean;
    locked?: boolean;
}

interface ModuleItem {
    id: string;
    title: string;
    duration: string;
    lessons: LessonItem[];
}

interface CourseDetail {
    id: string;
    title: string;
    description: string;
    instructor: {
        name: string;
        avatar: string;
        title: string;
        bio: string;
        courses: number;
        students: number;
        rating: number;
    };
    thumbnail: string;
    rating: number;
    reviewCount: number;
    students: number;
    duration: string;
    lessons: number;
    level: string;
    category: string;
    lastUpdated: string;
    language: string;
    certificate: boolean;
    enrolled: boolean;
    progress: number;
    features: string[];
    learningOutcomes: string[];
    modules: ModuleItem[];
}

// Mock course data
const mockCourseDetail: CourseDetail = {
    id: '1',
    title: 'Web Development Fundamentals',
    description:
        'Learn HTML, CSS, and JavaScript from scratch. This comprehensive course takes you from complete beginner to confident web developer. Build real-world projects and master modern web development techniques used by professionals.',
    instructor: {
        name: 'Dr. Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        title: 'Senior Software Engineer',
        bio: '10+ years of experience in web development. Previously worked at Google and Facebook.',
        courses: 12,
        students: 45000,
        rating: 4.9,
    },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    rating: 4.8,
    reviewCount: 1234,
    students: 15420,
    duration: '40 hours',
    lessons: 48,
    level: 'Beginner',
    category: 'Development',
    lastUpdated: '2026-01-10',
    language: 'English',
    certificate: true,
    enrolled: true,
    progress: 65,
    features: [
        '48 video lessons',
        '12 coding exercises',
        '5 real-world projects',
        'Certificate of completion',
        'Lifetime access',
        '24/7 support',
    ],
    learningOutcomes: [
        'Build responsive websites from scratch',
        'Master HTML5, CSS3, and JavaScript ES6+',
        'Understand web development best practices',
        'Create interactive user interfaces',
        'Deploy websites to production',
    ],
    modules: [
        {
            id: 'm1',
            title: 'Getting Started with Web Development',
            duration: '2 hours',
            lessons: [
                { id: 'l1', title: 'Course Introduction', duration: '5 min', type: 'video', completed: true },
                { id: 'l2', title: 'Setting Up Your Development Environment', duration: '15 min', type: 'video', completed: true },
                { id: 'l3', title: 'How the Web Works', duration: '12 min', type: 'video', completed: true },
                { id: 'l4', title: 'Quiz: Web Fundamentals', duration: '10 min', type: 'quiz', completed: true },
            ],
        },
        {
            id: 'm2',
            title: 'HTML Fundamentals',
            duration: '5 hours',
            lessons: [
                { id: 'l5', title: 'Introduction to HTML', duration: '20 min', type: 'video', completed: true },
                { id: 'l6', title: 'HTML Document Structure', duration: '18 min', type: 'video', completed: true },
                { id: 'l7', title: 'Working with Text Elements', duration: '22 min', type: 'video', completed: true },
                { id: 'l8', title: 'Links and Images', duration: '25 min', type: 'video', completed: true },
                { id: 'l9', title: 'HTML Forms', duration: '30 min', type: 'video', completed: false },
                { id: 'l10', title: 'Project: Build Your First Webpage', duration: '45 min', type: 'project', completed: false },
            ],
        },
        {
            id: 'm3',
            title: 'CSS Styling',
            duration: '8 hours',
            lessons: [
                { id: 'l11', title: 'Introduction to CSS', duration: '18 min', type: 'video', completed: false },
                { id: 'l12', title: 'Selectors and Properties', duration: '25 min', type: 'video', completed: false },
                { id: 'l13', title: 'CSS Box Model', duration: '20 min', type: 'video', completed: false },
                { id: 'l14', title: 'CSS Flexbox & Grid', duration: '35 min', type: 'video', completed: false, current: true },
                { id: 'l15', title: 'Responsive Design', duration: '30 min', type: 'video', completed: false },
                { id: 'l16', title: 'CSS Animations', duration: '25 min', type: 'video', completed: false },
            ],
        },
        {
            id: 'm4',
            title: 'JavaScript Essentials',
            duration: '12 hours',
            lessons: [
                { id: 'l17', title: 'JavaScript Fundamentals', duration: '30 min', type: 'video', completed: false, locked: true },
                { id: 'l18', title: 'Variables and Data Types', duration: '25 min', type: 'video', completed: false, locked: true },
                { id: 'l19', title: 'Functions and Scope', duration: '35 min', type: 'video', completed: false, locked: true },
                { id: 'l20', title: 'DOM Manipulation', duration: '40 min', type: 'video', completed: false, locked: true },
            ],
        },
    ],
};

export const CourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('curriculum');
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Always use real content from API
    const useRealContent = true;

    // Fetch course details
    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;
            
            try {
                setLoading(true);
                setError(null);
                // For now, use mock data as placeholder
                // TODO: Implement real API call when course details endpoint is ready
                setCourse(mockCourseDetail);
            } catch (err) {
                console.error('Error fetching course:', err);
                setError('Failed to load course');
                setCourse(mockCourseDetail); // Fallback to mock
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) {
        return <div className="course-view"><Loading message="Loading course..." /></div>;
    }

    if (error || !course) {
        return <div className="course-view"><p>Error loading course</p></div>;
    }

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const getCompletedLessons = () => {
        return course.modules.reduce(
            (acc, module) => acc + module.lessons.filter((l) => l.completed).length,
            0
        );
    };

    const getTotalLessons = () => {
        return course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <Video size={16} />;
            case 'quiz':
                return <FileText size={16} />;
            case 'project':
                return <Award size={16} />;
            default:
                return <BookOpen size={16} />;
        }
    };

    return (
        <div className="course-view">
            {/* Back Button */}
            <Link to="/student/catalog" className="back-link">
                <ArrowLeft size={20} />
                Back to Courses
            </Link>

            {/* Course Header */}
            <header className="course-header">
                <div className="header-content">
                    <div className="header-info animate-slideUp">
                        <div className="course-badges">
                            <span className="badge badge-primary">{course.category}</span>
                            <span className="badge badge-secondary">{course.level}</span>
                        </div>
                        <h1 className="course-title">{course.title}</h1>
                        <p className="course-description">{course.description}</p>

                        <div className="course-stats">
                            <div className="stat">
                                <Star size={16} fill="currentColor" className="star-icon" />
                                <span className="stat-value">{course.rating}</span>
                                <span className="stat-label">({course.reviewCount.toLocaleString()} reviews)</span>
                            </div>
                            <div className="stat">
                                <Users size={16} />
                                <span className="stat-value">{course.students.toLocaleString()}</span>
                                <span className="stat-label">students</span>
                            </div>
                            <div className="stat">
                                <Clock size={16} />
                                <span className="stat-value">{course.duration}</span>
                            </div>
                            <div className="stat">
                                <BookOpen size={16} />
                                <span className="stat-value">{course.lessons}</span>
                                <span className="stat-label">lessons</span>
                            </div>
                        </div>

                        <div className="instructor-mini">
                            <img src={course.instructor.avatar} alt={course.instructor.name} className="instructor-avatar" />
                            <div>
                                <span className="instructor-label">Created by</span>
                                <span className="instructor-name">{course.instructor.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        <div className="card-thumbnail">
                            <img src={course.thumbnail} alt={course.title} />
                            <button className="play-button">
                                <Play size={32} fill="white" />
                            </button>
                        </div>

                        {course.enrolled ? (
                            <div className="enrolled-section">
                                <div className="progress-info">
                                    <span className="progress-label">Your Progress</span>
                                    <span className="progress-value">{course.progress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }} />
                                </div>
                                <p className="progress-text">
                                    {getCompletedLessons()} of {getTotalLessons()} lessons completed
                                </p>
                                <Button variant="primary" fullWidth icon={<Play size={18} />}>
                                    Continue Learning
                                </Button>
                                <Button variant="ghost" fullWidth icon={<Download size={18} />}>
                                    Download Resources
                                </Button>
                            </div>
                        ) : (
                            <div className="enroll-section">
                                <span className="price">Free</span>
                                <Button variant="primary" fullWidth size="lg">
                                    Enroll Now
                                </Button>
                                <ul className="features-list">
                                    {course.features.slice(0, 4).map((feature, index) => (
                                        <li key={index}>
                                            <CheckCircle size={16} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="course-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
                    onClick={() => setActiveTab('curriculum')}
                >
                    Curriculum
                </button>
                <button
                    className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-content animate-fadeIn">
                        <section className="content-section">
                            <h2>What you'll learn</h2>
                            <ul className="outcomes-list">
                                {course.learningOutcomes.map((outcome, index) => (
                                    <li key={index}>
                                        <CheckCircle size={18} />
                                        {outcome}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="content-section">
                            <h2>About the Instructor</h2>
                            <Card className="instructor-card">
                                <div className="instructor-header">
                                    <img src={course.instructor.avatar} alt={course.instructor.name} className="instructor-photo" />
                                    <div className="instructor-info">
                                        <h3>{course.instructor.name}</h3>
                                        <p className="instructor-title">{course.instructor.title}</p>
                                        <div className="instructor-stats">
                                            <span><Star size={14} fill="currentColor" /> {course.instructor.rating} Rating</span>
                                            <span><Users size={14} /> {course.instructor.students.toLocaleString()} Students</span>
                                            <span><BookOpen size={14} /> {course.instructor.courses} Courses</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="instructor-bio">{course.instructor.bio}</p>
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div className="curriculum-content animate-fadeIn">
                        {useRealContent && courseId ? (
                            // Use real course content from backend (Requirement 15.1, 15.2, 15.3, 15.4, 15.5)
                            <CourseContentProvider courseId={courseId}>
                                <StudentContentView courseId={courseId} />
                            </CourseContentProvider>
                        ) : (
                            // Fallback to mock data for demo purposes
                            <>
                                <div className="curriculum-header">
                                    <span>{course.modules.length} modules</span>
                                    <span>•</span>
                                    <span>{getTotalLessons()} lessons</span>
                                    <span>•</span>
                                    <span>{course.duration} total</span>
                                </div>

                                <div className="modules-list">
                                    {course.modules.map((module, moduleIndex) => (
                                        <div key={module.id} className="module">
                                            <button
                                                className="module-header"
                                                onClick={() => toggleModule(module.id)}
                                            >
                                                <div className="module-info">
                                                    <span className="module-number">{moduleIndex + 1}</span>
                                                    <div>
                                                        <h3 className="module-title">{module.title}</h3>
                                                        <span className="module-meta">
                                                            {module.lessons.length} lessons • {module.duration}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`expand-icon ${expandedModules.includes(module.id) ? 'expanded' : ''}`}>
                                                    ▼
                                                </span>
                                            </button>

                                            {expandedModules.includes(module.id) && (
                                                <div className="lessons-list">
                                                    {module.lessons.map((lesson) => (
                                                        <div
                                                            key={lesson.id}
                                                            className={`lesson ${lesson.completed ? 'completed' : ''} ${lesson.current ? 'current' : ''} ${lesson.locked ? 'locked' : ''}`}
                                                        >
                                                            <div className="lesson-status">
                                                                {lesson.completed ? (
                                                                    <CheckCircle size={18} className="completed-icon" />
                                                                ) : lesson.locked ? (
                                                                    <Lock size={18} />
                                                                ) : (
                                                                    getLessonIcon(lesson.type)
                                                                )}
                                                            </div>
                                                            <div className="lesson-info">
                                                                <span className="lesson-title">{lesson.title}</span>
                                                                <span className="lesson-meta">
                                                                    {lesson.type} • {lesson.duration}
                                                                </span>
                                                            </div>
                                                            {!lesson.locked && (
                                                                <Button
                                                                    variant={lesson.current ? 'primary' : 'ghost'}
                                                                    size="sm"
                                                                >
                                                                    {lesson.completed ? 'Review' : lesson.current ? 'Continue' : 'Start'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="reviews-content animate-fadeIn">
                        <div className="reviews-summary">
                            <div className="overall-rating">
                                <span className="big-rating">{course.rating}</span>
                                <div className="stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={20}
                                            fill={star <= Math.round(course.rating) ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                                <span className="rating-count">{course.reviewCount.toLocaleString()} reviews</span>
                            </div>
                        </div>

                        <div className="reviews-list">
                            <Card className="review-card">
                                <div className="review-header">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50" alt="Reviewer" className="reviewer-avatar" />
                                    <div>
                                        <span className="reviewer-name">John Smith</span>
                                        <div className="review-stars">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={12} fill="currentColor" />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="review-date">2 weeks ago</span>
                                </div>
                                <p className="review-text">
                                    Excellent course! Dr. Johnson explains complex concepts in a very understandable way.
                                    The projects are practical and helped me build real-world skills.
                                </p>
                            </Card>

                            <Card className="review-card">
                                <div className="review-header">
                                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50" alt="Reviewer" className="reviewer-avatar" />
                                    <div>
                                        <span className="reviewer-name">Maria Garcia</span>
                                        <div className="review-stars">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={12} fill={i <= 4 ? 'currentColor' : 'none'} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="review-date">1 month ago</span>
                                </div>
                                <p className="review-text">
                                    Great content and well-structured curriculum. Would recommend for anyone starting their web development journey.
                                </p>
                            </Card>
                        </div>

                        <Button variant="outline" fullWidth icon={<MessageSquare size={18} />}>
                            Load More Reviews
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseView;
