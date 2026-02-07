import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
    label,
    error,
    options = [],
    placeholder = 'Select option',
    className = '',
    wrapperClassName = '',
    fullWidth = true,
    helperText,
    disabled = false,
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
                <select
                    ref={ref}
                    disabled={disabled}
                    className={`
            block w-full rounded-lg border appearance-none
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50 text-red-900'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white text-gray-900 hover:border-gray-400'
                        }
            transition-colors duration-200
            pl-4 pr-10 py-2.5 sm:text-sm
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            shadow-sm
            cursor-pointer
            ${className}
          `}
                    {...props}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {options.map((opt, index) => {
                        const value = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        return (
                            <option key={index} value={value}>
                                {label}
                            </option>
                        );
                    })}
                </select>

                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>

            {(error || helperText) && (
                <p className={`mt-1.5 text-xs ml-0.5 ${error ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
