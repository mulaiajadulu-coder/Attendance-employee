import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnOutsideClick = true
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full m-4'
    };

    const sizeClass = sizes[size] || sizes.md;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto w-screen h-scren flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={closeOnOutsideClick ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClass} transform transition-all flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-xl flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
