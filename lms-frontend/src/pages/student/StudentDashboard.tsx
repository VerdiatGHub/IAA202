import React, { useState, useEffect } from 'react';
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
import Loading from '../../components/common/Loading';
import { enrollmentService, type EnrollmentApiData } from '../../services/enrollmentService';
import { courseService } from '../../services/courseService';
import type { Course } from '../../types';
import './StudentDashboard.css';

interface StudentDashboardProps {
    userName?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    userName = 'Student',
}) => {
    const [enrollments, setEnrollments] = useState<EnrollmentApiData[]>([]);
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        studyHours: 0,
        certificates: 0,
        avgProgress: 0,
    });

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch enrollments
                const enrollmentsData = await enrollmentService.getMyEnrollments();
                setEnrollments(enrollmentsData);

                // Fetch enrollment stats
                const statsData = await enrollmentService.getEnrollmentStats();
                setStats({
                    enrolledCourses: statsData.enrolledCourses || enrollmentsData.length,
                    studyHours: 0, // TODO: Calculate from actual data
                    certificates: statsData.completedCourses || 0,
                    avgProgress: Math.round(statsData.averageProgress || 0),
                });

                // Fetch recommended courses (published courses not enrolled in)
                const allCourses = await courseService.getPublishedCourses();
                const enrolledCourseIds = new Set(enrollmentsData.map(e => e.courseId));
                const recommended = allCourses
                    .filter(course => !enrolledCourseIds.has(course.id))
                    .slice(0, 2);
                setRecommendedCourses(recommended);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const statsCards = [
        {
            label: 'Enrolled Courses',
            value: stats.enrolledCourses.toString(),
            icon: <BookOpen size={24} />,
            color: 'primary',
        },
        {
            label: 'Study Hours',
            value: stats.studyHours.toString(),
            icon: <Clock size={24} />,
            color: 'success',
        },
        {
            label: 'Certificates',
            value: stats.certificates.toString(),
            icon: <Trophy size={24} />,
            color: 'warning',
        },
        {
            label: 'Avg. Progress',
            value: `${stats.avgProgress}%`,
            icon: <TrendingUp size={24} />,
            color: 'info',
        },
    ];

    if (loading) {
        return <Loading message="Loading dashboard..." />;
    }

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
                    {statsCards.map((stat, index) => (
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
                        {enrollments.length === 0 ? (
                            <Card className="empty-state">
                                <BookOpen size={48} />
                                <h3>No enrolled courses yet</h3>
                                <p>Browse our course catalog to get started</p>
                                <Link to="/student/catalog">
                                    <Button variant="primary">Browse Courses</Button>
                                </Link>
                            </Card>
                        ) : (
                            enrollments.slice(0, 3).map((enrollment, index) => (
                                <Link to={`/student/courses/${enrollment.courseId}`} key={enrollment.id}>
                                    <Card
                                        className="course-card animate-slideUp"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        padding="none"
                                    >
                                        <div className="course-thumbnail">
                                            <img 
                                                src={enrollment.course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'} 
                                                alt={enrollment.course.title} 
                                            />
                                            <div className="course-overlay">
                                                <Button variant="primary" size="sm" icon={<Play size={14} />}>
                                                    Resume
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="course-info">
                                            <h3 className="course-title">{enrollment.course.title}</h3>
                                            <p className="course-instructor">{enrollment.course.instructorName || 'Instructor'}</p>
                                            <div className="course-progress">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{ width: `${enrollment.progress}%` }}
                                                    />
                                                </div>
                                                <span className="progress-text">{enrollment.progress}% complete</span>
                                            </div>
                                            <div className="course-meta">
                                                <span className="next-lesson">
                                                    {enrollment.course.lessonCount || 0} lessons
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    {/* Upcoming Deadlines - Placeholder for now */}
                    <Card className="deadlines-card animate-slideUp">
                        <CardHeader>
                            <CardTitle>
                                <Calendar size={20} />
                                Upcoming Deadlines
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="empty-state-small">
                                <p>No upcoming deadlines</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommended Courses */}
                    <Card className="recommendations-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle>
                                <Star size={20} />
                                Recommended for You
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recommendedCourses.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>No recommendations available</p>
                                </div>
                            ) : (
                                <>
                                    <div className="recommendations-list">
                                        {recommendedCourses.map((course) => (
                                            <Link to={`/student/courses/${course.id}`} key={course.id}>
                                                <div className="recommendation-item">
                                                    <img
                                                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'}
                                                        alt={course.title}
                                                        className="recommendation-thumb"
                                                    />
                                                    <div className="recommendation-info">
                                                        <h4 className="recommendation-title">{course.title}</h4>
                                                        <p className="recommendation-instructor">
                                                            {course.instructor?.fullName || 'Instructor'}
                                                        </p>
                                                        <div className="recommendation-meta">
                                                            <span className="rating">
                                                                <Star size={12} fill="currentColor" />
                                                                4.8
                                                            </span>
                                                            <span className="students">
                                                                {(course.enrollmentCount || 0).toLocaleString()} students
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link to="/student/catalog">
                                        <Button variant="outline" fullWidth size="sm">
                                            Browse More Courses
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default StudentDashboard;
