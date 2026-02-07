import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled = false,
    type = 'button',
    icon: Icon,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-95';

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 focus:ring-blue-500',
        secondary: 'bg-gray-800 hover:bg-gray-900 text-white shadow-lg shadow-gray-500/20 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 focus:ring-red-500',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 focus:ring-green-500',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/30 focus:ring-yellow-500',
        outline: 'border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 bg-transparent focus:ring-gray-200',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-200',
        link: 'text-blue-600 hover:underline p-0 h-auto font-normal'
    };

    const sizes = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-2'
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {!isLoading && Icon && (
                <Icon className={`${children ? 'mr-2' : ''} h-4 w-4`} />
            )}
            {children}
        </button>
    );
};

export default Button;
