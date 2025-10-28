import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Chip = ({ children, onRemove, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
        'hover:shadow-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:bg-white/50 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export { Chip };
