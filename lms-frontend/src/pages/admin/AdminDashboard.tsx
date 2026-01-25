import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    BookOpen,
    TrendingUp,
    Shield,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getUserStats } from '../../services/userService';
import { getCourseStats } from '../../services/courseService';
import './AdminDashboard.css';

interface Stats {
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [userStats, courseStats] = await Promise.all([
                getUserStats(),
                getCourseStats(),
            ]);

            setStats({
                totalUsers: userStats.totalUsers,
                totalStudents: userStats.totalStudents,
                totalInstructors: userStats.totalInstructors,
                totalAdmins: userStats.totalAdmins,
                totalCourses: courseStats.totalCourses,
                publishedCourses: courseStats.publishedCourses,
                totalEnrollments: courseStats.totalEnrollments,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const statsCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users size={24} />, color: 'primary' },
        { label: 'Total Courses', value: stats.totalCourses.toLocaleString(), icon: <BookOpen size={24} />, color: 'success' },
        { label: 'Enrollments', value: stats.totalEnrollments.toLocaleString(), icon: <TrendingUp size={24} />, color: 'info' },
        { label: 'Instructors', value: stats.totalInstructors.toLocaleString(), icon: <Shield size={24} />, color: 'warning' },
    ] : [];

    if (error && !stats) {
        return (
            <div className="admin-dashboard">
                <div className="error-container">
                    <AlertCircle size={48} />
                    <h2>Failed to Load Dashboard</h2>
                    <p>{error}</p>
                    <Button onClick={fetchData} icon={<RefreshCw size={18} />}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <section className="admin-header animate-slideUp">
                <div className="header-content">
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Manage users, courses, and platform settings</p>
                </div>
                <div className="header-actions">
                    <Button
                        variant="outline"
                        icon={<RefreshCw size={18} />}
                        onClick={fetchData}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index} className="stat-card stat-loading animate-pulse">
                                <div className="stat-skeleton"></div>
                            </Card>
                        ))
                    ) : (
                        statsCards.map((stat, index) => (
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
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
