import React, { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    error,
    type = 'text',
    className = '',
    wrapperClassName = '',
    icon: Icon,
    fullWidth = true,
    helperText,
    ...props
}, ref) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Icon className="h-4 w-4" />
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={`
            block w-full rounded-lg border 
            ${error
                            ? 'border-red-300 placeholder-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50 text-red-900'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white text-gray-900 hover:border-gray-400'
                        } 
            transition-colors duration-200
            ${Icon ? 'pl-10' : 'pl-4'} 
            pr-4 py-2.5 sm:text-sm
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            shadow-sm
            ${className}
          `}
                    {...props}
                />
            </div>

            {(error || helperText) && (
                <p className={`mt-1.5 text-xs ml-0.5 ${error ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
