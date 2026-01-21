import React from 'react';
import { Loader2 } from 'lucide-react';
import './Loading.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = '',
}) => {
    const sizes = {
        sm: 16,
        md: 24,
        lg: 40,
    };

    return (
        <Loader2
            className={`loading-spinner loading-spinner-${size} ${className}`}
            size={sizes[size]}
        />
    );
};

interface LoadingPageProps {
    message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
    message = 'Loading...',
}) => {
    return (
        <div className="loading-page">
            <div className="loading-page-content">
                <LoadingSpinner size="lg" />
                <p className="loading-message">{message}</p>
            </div>
        </div>
    );
};

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius,
    className = '',
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius,
            }}
        />
    );
};

interface SkeletonCardProps {
    className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
    return (
        <div className={`skeleton-card ${className}`}>
            <Skeleton height={160} className="skeleton-card-image" />
            <div className="skeleton-card-content">
                <Skeleton height={24} width="80%" />
                <Skeleton height={16} width="60%" />
                <Skeleton height={16} width="40%" />
            </div>
        </div>
    );
};

export default LoadingSpinner;
