import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
}) => {
    const handleEsc = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEsc) {
                onClose();
            }
        },
        [onClose, closeOnEsc]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEsc]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fadeIn" onClick={closeOnOverlayClick ? onClose : undefined}>
            <div
                className={`modal-container modal-${size} animate-scaleIn`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        <div className="modal-header-text">
                            {title && (
                                <h2 id="modal-title" className="modal-title">
                                    {title}
                                </h2>
                            )}
                            {description && <p className="modal-description">{description}</p>}
                        </div>
                        {showCloseButton && (
                            <button className="modal-close" onClick={onClose} aria-label="Close modal">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-content">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
