import { cn } from '@/lib/utils'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

const fieldBase =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-xl ' +
  'px-4 py-2.5 text-body-md text-on-surface placeholder:text-outline ' +
  'focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,71,123,0.12)] ' +
  'transition-all duration-150'

const labelCls = 'text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-unit-xs w-full">
        {label && (
          <label htmlFor={inputId} className={labelCls}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(fieldBase, icon && 'pl-10', error && 'border-error focus:border-error focus:shadow-[0_0_0_4px_rgba(186,26,26,0.12)]', className)}
            {...props}
          />
        </div>
        {error && <span className="text-label-md text-error">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-unit-xs w-full">
        {label && (
          <label htmlFor={inputId} className={labelCls}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldBase, 'cursor-pointer', error && 'border-error', className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <span className="text-label-md text-error">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-unit-xs w-full">
        {label && (
          <label htmlFor={inputId} className={labelCls}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldBase, 'resize-y', error && 'border-error focus:border-error', className)}
          {...props}
        />
        {error && <span className="text-label-md text-error">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
