import React from 'react';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    dot = false,
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800 border-gray-200',
        primary: 'bg-blue-50 text-blue-700 border-blue-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        pink: 'bg-pink-50 text-pink-700 border-pink-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1'
    };

    const variantStyles = variants[variant] || variants.default;
    const sizeStyles = sizes[size] || sizes.md;

    const dotColors = {
        default: 'bg-gray-400',
        primary: 'bg-blue-400',
        success: 'bg-green-400',
        warning: 'bg-amber-400',
        danger: 'bg-red-400',
        purple: 'bg-purple-400',
        pink: 'bg-pink-400',
        indigo: 'bg-indigo-400'
    };

    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full border
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant] || dotColors.default}`} />
            )}
            {children}
        </span>
    );
};

export default Badge;
