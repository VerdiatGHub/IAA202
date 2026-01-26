import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading, error, clearError } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch {
            // Error is handled by AuthContext
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear field error on change
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-gradient"></div>
                <div className="auth-pattern"></div>
            </div>

            <div className="auth-container">
                <div className="auth-card animate-scaleIn">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <GraduationCap size={40} />
                        </div>
                        <h1 className="auth-title">Welcome Back!</h1>
                        <p className="auth-subtitle">Sign in to continue your learning journey</p>
                    </div>

                    {error && (
                        <div className="auth-error animate-slideDown">
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={formErrors.email}
                            icon={<Mail size={18} />}
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            error={formErrors.password}
                            icon={<Lock size={18} />}
                            autoComplete="current-password"
                        />

                        <div className="auth-options">
                            <div></div>
                            <Link to="/forgot-password" className="auth-link">
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                            icon={<LogIn size={18} />}
                        >
                            Sign In
                        </Button>
                    </form>



                    <p className="auth-footer">
                        Contact your administrator for account access
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
