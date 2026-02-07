import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

const Alert = ({
    variant = 'info',
    title,
    children,
    className = '',
    onClose,
    ...props
}) => {
    const variants = {
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: <Info className="h-5 w-5 text-blue-500" />,
            close: 'text-blue-500 hover:bg-blue-100'
        },
        success: {
            container: 'bg-green-50 border-green-200 text-green-800',
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            close: 'text-green-500 hover:bg-green-100'
        },
        warning: {
            container: 'bg-amber-50 border-amber-200 text-amber-800',
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
            close: 'text-amber-500 hover:bg-amber-100'
        },
        danger: {
            container: 'bg-red-50 border-red-200 text-red-800',
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            close: 'text-red-500 hover:bg-red-100'
        }
    };

    const style = variants[variant] || variants.info;

    return (
        <div
            className={`
        relative flex items-start p-4 rounded-lg border gap-3
        ${style.container}
        ${className}
      `}
            role="alert"
            {...props}
        >
            <div className="flex-shrink-0 mt-0.5">
                {style.icon}
            </div>

            <div className="flex-1 text-sm">
                {title && (
                    <h5 className="font-medium mb-1 leading-none tracking-tight">
                        {title}
                    </h5>
                )}
                <div className={`${title ? 'text-opacity-90' : 'font-medium'}`}>
                    {children}
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className={`
            -mr-1 -mt-1 p-1.5 rounded-full transition-colors
            ${style.close}
          `}
                    aria-label="Close"
                >
                    <XCircle className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default Alert;
