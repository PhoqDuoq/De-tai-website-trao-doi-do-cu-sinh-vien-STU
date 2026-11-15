import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className, text }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-2" role="status">
      <Loader2 className={cn('animate-spin text-stu-blue', sizes[size] || sizes.md, className)} />
      {text && <span className="text-sm font-medium text-slate-500">{text}</span>}
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
