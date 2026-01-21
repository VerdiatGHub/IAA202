import React from 'react';
import {
    BookOpen,
    Clock,
    Trophy,
    TrendingUp,
    Calendar,
    ChevronRight,
    Play,
    Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './StudentDashboard.css';

// Mock data - would come from Supabase in production
const mockEnrolledCourses = [
    {
        id: '1',
        title: 'Web Development Fundamentals',
        instructor: 'Dr. Sarah Johnson',
        progress: 65,
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        nextLesson: 'CSS Flexbox & Grid',
        totalLessons: 24,
        completedLessons: 16,
    },
    {
        id: '2',
        title: 'Python for Data Science',
        instructor: 'Prof. Michael Chen',
        progress: 42,
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
        nextLesson: 'Pandas DataFrames',
        totalLessons: 30,
        completedLessons: 13,
    },
    {
        id: '3',
        title: 'UI/UX Design Principles',
        instructor: 'Emily Rodriguez',
        progress: 88,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        nextLesson: 'Design Systems',
        totalLessons: 18,
        completedLessons: 16,
    },
];

const mockUpcomingDeadlines = [
    {
        id: '1',
        title: 'JavaScript Quiz',
        course: 'Web Development Fundamentals',
        dueDate: '2026-01-17',
        type: 'quiz',
    },
    {
        id: '2',
        title: 'Data Analysis Project',
        course: 'Python for Data Science',
        dueDate: '2026-01-20',
        type: 'assignment',
    },
    {
        id: '3',
        title: 'Portfolio Submission',
        course: 'UI/UX Design Principles',
        dueDate: '2026-01-22',
        type: 'assignment',
    },
];

const mockRecommendedCourses = [
    {
        id: '4',
        title: 'React Advanced Patterns',
        instructor: 'Alex Turner',
        rating: 4.9,
        students: 2340,
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
        level: 'Advanced',
    },
    {
        id: '5',
        title: 'Machine Learning Basics',
        instructor: 'Dr. Lisa Wang',
        rating: 4.8,
        students: 5120,
        thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
        level: 'Intermediate',
    },
];

interface StudentDashboardProps {
    userName?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    userName = 'Student',
}) => {
    const stats = [
        {
            label: 'Enrolled Courses',
            value: '6',
            icon: <BookOpen size={24} />,
            color: 'primary',
        },
        {
            label: 'Study Hours',
            value: '48',
            icon: <Clock size={24} />,
            color: 'success',
        },
        {
            label: 'Certificates',
            value: '3',
            icon: <Trophy size={24} />,
            color: 'warning',
        },
        {
            label: 'Avg. Progress',
            value: '65%',
            icon: <TrendingUp size={24} />,
            color: 'info',
        },
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDaysUntil = (dateString: string) => {
        const today = new Date();
        const dueDate = new Date(dateString);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="student-dashboard">
            {/* Welcome Section */}
            <section className="welcome-section animate-slideUp">
                <div className="welcome-content">
                    <h1 className="welcome-title">
                        Welcome back, <span className="gradient-text">{userName}</span>! 👋
                    </h1>
                    <p className="welcome-subtitle">
                        Continue your learning journey. You're making great progress!
                    </p>
                </div>
                <div className="welcome-action">
                    <Button variant="primary" icon={<Play size={18} />}>
                        Continue Learning
                    </Button>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <Card key={stat.label} className={`stat-card stat-${stat.color} animate-slideUp`} style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Continue Learning */}
                <section className="enrolled-section">
                    <div className="section-header">
                        <h2 className="section-title">Continue Learning</h2>
                        <Link to="/student/courses" className="view-all-link">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="courses-list">
                        {mockEnrolledCourses.map((course, index) => (
                            <Card
                                key={course.id}
                                className="course-card animate-slideUp"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                padding="none"
                            >
                                <div className="course-thumbnail">
                                    <img src={course.thumbnail} alt={course.title} />
                                    <div className="course-overlay">
                                        <Button variant="primary" size="sm" icon={<Play size={14} />}>
                                            Resume
                                        </Button>
                                    </div>
                                </div>
                                <div className="course-info">
                                    <h3 className="course-title">{course.title}</h3>
                                    <p className="course-instructor">{course.instructor}</p>
                                    <div className="course-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                        <span className="progress-text">{course.progress}% complete</span>
                                    </div>
                                    <div className="course-meta">
                                        <span className="next-lesson">
                                            Next: {course.nextLesson}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    {/* Upcoming Deadlines */}
                    <Card className="deadlines-card animate-slideUp">
                        <CardHeader>
                            <CardTitle>
                                <Calendar size={20} />
                                Upcoming Deadlines
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="deadlines-list">
                                {mockUpcomingDeadlines.map((deadline) => {
                                    const daysUntil = getDaysUntil(deadline.dueDate);
                                    return (
                                        <li key={deadline.id} className="deadline-item">
                                            <div className="deadline-info">
                                                <span className={`deadline-type ${deadline.type}`}>
                                                    {deadline.type}
                                                </span>
                                                <h4 className="deadline-title">{deadline.title}</h4>
                                                <p className="deadline-course">{deadline.course}</p>
                                            </div>
                                            <div className={`deadline-date ${daysUntil <= 2 ? 'urgent' : ''}`}>
                                                <span className="date">{formatDate(deadline.dueDate)}</span>
                                                <span className="days">
                                                    {daysUntil === 0
                                                        ? 'Today'
                                                        : daysUntil === 1
                                                            ? 'Tomorrow'
                                                            : `${daysUntil} days`}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <Button variant="ghost" fullWidth size="sm">
                                View All Deadlines
                            </Button>
                        </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    <Card className="recommendations-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle>
                                <Star size={20} />
                                Recommended for You
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="recommendations-list">
                                {mockRecommendedCourses.map((course) => (
                                    <div key={course.id} className="recommendation-item">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="recommendation-thumb"
                                        />
                                        <div className="recommendation-info">
                                            <h4 className="recommendation-title">{course.title}</h4>
                                            <p className="recommendation-instructor">{course.instructor}</p>
                                            <div className="recommendation-meta">
                                                <span className="rating">
                                                    <Star size={12} fill="currentColor" />
                                                    {course.rating}
                                                </span>
                                                <span className="students">{course.students.toLocaleString()} students</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" fullWidth size="sm">
                                Browse More Courses
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default StudentDashboard;
