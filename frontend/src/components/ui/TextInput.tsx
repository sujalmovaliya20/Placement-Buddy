import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', labelClassName = 'text-current', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-[4px] w-full">
        {label && (
          <label className={`font-helvetica text-ui-label select-none font-bold ${labelClassName}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none focus:ring-1 focus:ring-[#000000] w-full ${error ? 'border-[#e91d2a] ring-1 ring-[#e91d2a]' : ''
            } ${className}`}
          {...props}
        />
        {error && (
          <p className="font-times-new-roman text-body-sm text-[#e91d2a] font-bold">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
