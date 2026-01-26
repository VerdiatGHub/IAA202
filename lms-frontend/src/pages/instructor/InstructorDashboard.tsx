import React from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Users,
    DollarSign,
    TrendingUp,
    Eye,
    MoreVertical,
    Star,
    Clock,
    BarChart3,
    MessageSquare,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './InstructorDashboard.css';

// Mock data
const mockStats = [
    { label: 'Total Students', value: '2,847', change: '+12%', icon: <Users size={24} />, color: 'primary' },
    { label: 'Active Courses', value: '8', change: '+2', icon: <BookOpen size={24} />, color: 'success' },
    { label: 'Total Revenue', value: '$12,450', change: '+8%', icon: <DollarSign size={24} />, color: 'warning' },
    { label: 'Avg. Rating', value: '4.8', change: '+0.2', icon: <Star size={24} />, color: 'info' },
];

const mockCourses = [
    {
        id: '1',
        title: 'Web Development Fundamentals',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200',
        students: 1542,
        rating: 4.8,
        revenue: 4680,
        status: 'published',
        lastUpdated: '2 days ago',
    },
    {
        id: '2',
        title: 'Advanced React Patterns',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=200',
        students: 876,
        rating: 4.9,
        revenue: 3240,
        status: 'published',
        lastUpdated: '1 week ago',
    },
    {
        id: '3',
        title: 'Node.js Backend Development',
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=200',
        students: 429,
        rating: 4.7,
        revenue: 2130,
        status: 'draft',
        lastUpdated: '3 days ago',
    },
];

const mockRecentActivity = [
    { id: '1', type: 'enrollment', message: 'John Doe enrolled in Web Development Fundamentals', time: '5 min ago' },
    { id: '2', type: 'review', message: 'Sarah gave 5 stars to Advanced React Patterns', time: '1 hour ago' },
    { id: '3', type: 'submission', message: 'Mike submitted Assignment 3 in Web Development', time: '2 hours ago' },
    { id: '4', type: 'question', message: 'New question in Node.js course discussion', time: '3 hours ago' },
];

const mockPendingTasks = [
    { id: '1', title: 'Review 12 new submissions', course: 'Web Development Fundamentals', priority: 'high' },
    { id: '2', title: 'Answer 5 student questions', course: 'Advanced React Patterns', priority: 'medium' },
    { id: '3', title: 'Update course materials', course: 'Node.js Backend Development', priority: 'low' },
];

interface InstructorDashboardProps {
    userName?: string;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
    userName = 'Instructor',
}) => {
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'enrollment': return <Users size={16} />;
            case 'review': return <Star size={16} />;
            case 'submission': return <CheckCircle size={16} />;
            case 'question': return <MessageSquare size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="instructor-dashboard">
            {/* Welcome Section */}
            <section className="welcome-section animate-slideUp">
                <div className="welcome-content">
                    <h1 className="welcome-title">
                        Welcome back, <span className="gradient-text">{userName}</span>! 🎓
                    </h1>
                    <p className="welcome-subtitle">
                        Here's what's happening with your courses today
                    </p>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {mockStats.map((stat, index) => (
                        <Card
                            key={stat.label}
                            className={`stat-card stat-${stat.color} animate-slideUp`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Main Content */}
            <div className="dashboard-grid">
                {/* Courses Section */}
                <section className="courses-section">
                    <div className="section-header">
                        <h2 className="section-title">Your Courses</h2>
                        <Link to="/instructor/courses" className="view-all-link">
                            View All
                        </Link>
                    </div>

                    <div className="courses-table">
                        <div className="table-header">
                            <span className="col-course">Course</span>
                            <span className="col-students">Students</span>
                            <span className="col-rating">Rating</span>
                            <span className="col-revenue">Revenue</span>
                            <span className="col-status">Status</span>
                            <span className="col-actions">Actions</span>
                        </div>

                        {mockCourses.map((course, index) => (
                            <div
                                key={course.id}
                                className="table-row animate-slideUp"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="col-course">
                                    <img src={course.thumbnail} alt={course.title} className="course-thumb" />
                                    <div className="course-info">
                                        <span className="course-title">{course.title}</span>
                                        <span className="course-updated">Updated {course.lastUpdated}</span>
                                    </div>
                                </div>
                                <div className="col-students">
                                    <Users size={14} />
                                    {course.students.toLocaleString()}
                                </div>
                                <div className="col-rating">
                                    <Star size={14} fill="currentColor" />
                                    {course.rating}
                                </div>
                                <div className="col-revenue">${course.revenue.toLocaleString()}</div>
                                <div className="col-status">
                                    <span className={`status-badge ${course.status}`}>
                                        {course.status}
                                    </span>
                                </div>
                                <div className="col-actions">
                                    <Link to={`/instructor/courses/${course.id}`} className="action-btn" title="View">
                                        <Eye size={16} />
                                    </Link>
                                    <button className="action-btn" title="More">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    {/* Pending Tasks */}
                    <Card className="tasks-card animate-slideUp">
                        <CardHeader>
                            <CardTitle>
                                <AlertCircle size={20} />
                                Pending Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="tasks-list">
                                {mockPendingTasks.map((task) => (
                                    <li key={task.id} className="task-item">
                                        <span className={`priority-dot ${task.priority}`} />
                                        <div className="task-info">
                                            <span className="task-title">{task.title}</span>
                                            <span className="task-course">{task.course}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" fullWidth size="sm">
                                View All Tasks
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="activity-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        <CardHeader>
                            <CardTitle>
                                <Clock size={20} />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="activity-list">
                                {mockRecentActivity.map((activity) => (
                                    <li key={activity.id} className="activity-item">
                                        <div className={`activity-icon ${activity.type}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="activity-info">
                                            <span className="activity-message">{activity.message}</span>
                                            <span className="activity-time">{activity.time}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Quick Analytics */}
                    <Card className="analytics-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle>
                                <BarChart3 size={20} />
                                This Week
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="analytics-item">
                                <span className="analytics-label">New Enrollments</span>
                                <span className="analytics-value">+127</span>
                            </div>
                            <div className="analytics-item">
                                <span className="analytics-label">Course Completions</span>
                                <span className="analytics-value">+43</span>
                            </div>
                            <div className="analytics-item">
                                <span className="analytics-label">Reviews Received</span>
                                <span className="analytics-value">+18</span>
                            </div>
                            <Button variant="ghost" fullWidth size="sm" icon={<TrendingUp size={16} />}>
                                View Full Analytics
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default InstructorDashboard;
