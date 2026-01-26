import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Play,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingPage } from '../../components/common/Loading';
import { enrollmentService, type EnrollmentApiData } from '../../services/enrollmentService';
import './MyCourses.css';

export const MyCourses: React.FC = () => {
    const [enrollments, setEnrollments] = useState<EnrollmentApiData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                const data = await enrollmentService.getMyEnrollments();
                setEnrollments(data);
            } catch (err) {
                console.error('Error fetching enrollments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, []);

    if (loading) {
        return <LoadingPage message="Loading your courses..." />;
    }

    return (
        <div className="my-courses">
            {/* Header */}
            <section className="courses-header animate-slideUp">
                <div className="header-content">
                    <h1 className="courses-title">My Courses</h1>
                    <p className="courses-subtitle">
                        {enrollments.length === 0
                            ? 'You are not enrolled in any courses yet'
                            : `You are enrolled in ${enrollments.length} course${enrollments.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                {enrollments.length > 0 && (
                    <Link to="/student/catalog">
                        <Button variant="outline">Browse More Courses</Button>
                    </Link>
                )}
            </section>

            {/* Courses Grid */}
            <section className="enrolled-courses-grid">
                {enrollments.length === 0 ? (
                    <Card className="empty-state">
                        <BookOpen size={64} />
                        <h2>No enrolled courses yet</h2>
                        <p>Start your learning journey by browsing our course catalog</p>
                        <Link to="/student/catalog">
                            <Button variant="primary" size="lg">
                                Browse Courses
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    enrollments.map((enrollment, index) => (
                        <Link
                            to={`/student/courses/${enrollment.courseId}`}
                            key={enrollment.id}
                            className="course-link"
                        >
                            <Card
                                className="enrolled-course-card animate-slideUp"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                padding="none"
                            >
                                <div className="course-thumbnail">
                                    <img
                                        src={
                                            enrollment.course.thumbnailUrl ||
                                            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'
                                        }
                                        alt={enrollment.course.title}
                                    />
                                    <div className="course-overlay">
                                        <Button variant="primary" icon={<Play size={18} />}>
                                            Continue Learning
                                        </Button>
                                    </div>
                                </div>

                                <div className="course-content">
                                    <div className="course-header">
                                        <div className="course-badges">
                                            {enrollment.course.category && (
                                                <span className="category-badge">
                                                    {enrollment.course.category}
                                                </span>
                                            )}
                                            {enrollment.course.level && (
                                                <span className="level-badge">
                                                    {enrollment.course.level}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="course-title">{enrollment.course.title}</h3>

                                    <p className="course-instructor">
                                        {enrollment.course.instructorName || 'Instructor'}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span className="progress-label">Progress</span>
                                            <span className="progress-value">{enrollment.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${enrollment.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Course Meta */}
                                    <div className="course-meta">
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{enrollment.course.duration || 'Self-paced'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <BookOpen size={14} />
                                            <span>{enrollment.course.lessonCount || 0} lessons</span>
                                        </div>
                                        <div className="meta-item">
                                            <TrendingUp size={14} />
                                            <span>
                                                {enrollment.completedAt
                                                    ? 'Completed'
                                                    : 'In Progress'}
                                            </span>
                                        </div>
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

export default MyCourses;
