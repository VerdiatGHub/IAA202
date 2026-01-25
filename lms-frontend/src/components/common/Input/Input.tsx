import React, { forwardRef, useId } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            hint,
            icon,
            iconPosition = 'left',
            fullWidth = true,
            type = 'text',
            id,
            className = '',
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const autoId = useId();
        const inputId = id || autoId;
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const wrapperClasses = [
            'input-wrapper',
            fullWidth ? 'input-full' : '',
            error ? 'input-error' : '',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClasses}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                    </label>
                )}
                <div className="input-container">
                    {icon && iconPosition === 'left' && (
                        <span className="input-icon input-icon-left">{icon}</span>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        id={inputId}
                        className={`input-field ${icon && iconPosition === 'left' ? 'has-icon-left' : ''} ${isPassword || (icon && iconPosition === 'right') ? 'has-icon-right' : ''
                            }`}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            className="input-icon input-icon-right input-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                    {!isPassword && icon && iconPosition === 'right' && (
                        <span className="input-icon input-icon-right">{icon}</span>
                    )}
                </div>
                {error && (
                    <span className="input-error-message">
                        <AlertCircle size={14} />
                        {error}
                    </span>
                )}
                {!error && hint && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
