'use client'

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm
            text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none
            focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900
            transition-colors duration-150
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm
            text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none resize-none
            focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900
            transition-colors duration-150
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm
            text-gray-800 dark:text-slate-100 outline-none
            focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900
            transition-colors duration-150
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
