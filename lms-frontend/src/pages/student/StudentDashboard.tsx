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
import { LoadingPage } from '../../components/common/Loading';
import { enrollmentService, type EnrollmentApiData } from '../../services/enrollmentService';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import type { Course, Assignment } from '../../types';
import './StudentDashboard.css';

interface StudentDashboardProps {
    userName?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    userName = 'Student',
}) => {
    const [enrollments, setEnrollments] = useState<EnrollmentApiData[]>([]);
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
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
                
                // Calculate study hours based on progress (rough estimate)
                const totalStudyHours = enrollmentsData.reduce((acc, enrollment) => {
                    // Assume each course has ~40 hours, calculate based on progress
                    const estimatedHours = Math.round((enrollment.progress / 100) * 40);
                    return acc + estimatedHours;
                }, 0);

                setStats({
                    enrolledCourses: statsData.enrolledCourses || enrollmentsData.length,
                    studyHours: totalStudyHours,
                    certificates: statsData.completedCourses || 0,
                    avgProgress: Math.round(statsData.averageProgress || 0),
                });

                // Fetch upcoming assignments from enrolled courses
                const allAssignments: Assignment[] = [];
                for (const enrollment of enrollmentsData) {
                    try {
                        const assignments = await assignmentService.getAssignmentsByCourse(enrollment.courseId);
                        allAssignments.push(...assignments);
                    } catch (err) {
                        console.error(`Error fetching assignments for course ${enrollment.courseId}:`, err);
                    }
                }
                
                // Sort by due date and get upcoming ones
                const now = new Date();
                const upcoming = allAssignments
                    .filter(a => a.dueDate && new Date(a.dueDate) > now)
                    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                    .slice(0, 3);
                setUpcomingAssignments(upcoming);

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

    if (loading) {
        return <LoadingPage message="Loading dashboard..." />;
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
                    {/* Upcoming Deadlines */}
                    <Card className="deadlines-card animate-slideUp">
                        <CardHeader>
                            <CardTitle>
                                <Calendar size={20} />
                                Upcoming Deadlines
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingAssignments.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>No upcoming deadlines</p>
                                </div>
                            ) : (
                                <>
                                    <ul className="deadlines-list">
                                        {upcomingAssignments.map((assignment) => {
                                            const daysUntil = assignment.dueDate ? getDaysUntil(assignment.dueDate) : 0;
                                            return (
                                                <li key={assignment.id} className="deadline-item">
                                                    <div className="deadline-info">
                                                        <span className="deadline-type assignment">
                                                            assignment
                                                        </span>
                                                        <h4 className="deadline-title">{assignment.title}</h4>
                                                        <p className="deadline-course">Course Assignment</p>
                                                    </div>
                                                    <div className={`deadline-date ${daysUntil <= 2 ? 'urgent' : ''}`}>
                                                        <span className="date">
                                                            {assignment.dueDate ? formatDate(assignment.dueDate) : 'No date'}
                                                        </span>
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
                                </>
                            )}
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
