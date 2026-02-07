import React from 'react';

const Card = ({
    children,
    className = '',
    title,
    description,
    footer,
    noPadding = false,
    bordered = true,
    onClick,
    ...props
}) => {
    return (
        <div
            className={`
        bg-white rounded-xl 
        ${bordered ? 'border border-gray-100' : ''}
        shadow-sm hover:shadow-md transition-shadow duration-300
        ${onClick ? 'cursor-pointer hover:border-blue-200 active:scale-[0.99] transition-all' : ''}
        ${className}
      `}
            onClick={onClick}
            {...props}
        >
            {(title || description) && (
                <div className="px-6 py-4 border-b border-gray-50">
                    {title && <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>}
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
            )}

            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>

            {footer && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-xl">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
