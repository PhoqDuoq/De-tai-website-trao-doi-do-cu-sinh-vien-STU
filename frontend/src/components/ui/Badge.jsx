import React from 'react';
import { CheckCircle2, Clock, XCircle, Shield, ShieldAlert, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  children,
  size = 'md',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border transition-colors select-none';

  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-blue-50 text-stu-blue border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    outline: 'border-slate-300 text-slate-600 bg-transparent',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Specialized Badge for Student Verification Status
 */
export function VerificationBadge({ status, className }) {
  const statusConfig = {
    VERIFIED: {
      label: 'Đã xác thực STU',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    APPROVED: {
      label: 'Đã xác thực STU',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    PENDING: {
      label: 'Chờ xét duyệt',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    REJECTED: {
      label: 'Bị từ chối',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const current = statusConfig[status] || {
    label: 'Chưa xác thực',
    icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-2xs',
        current.classes,
        className
      )}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}

/**
 * Specialized Badge for User Role
 */
export function RoleBadge({ role, className }) {
  const cleanRole = (role || '').replace('ROLE_', '');

  const roleConfig = {
    ADMIN: {
      label: 'Quản trị viên',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    MODERATOR: {
      label: 'Kiểm duyệt viên',
      icon: <Shield className="w-3.5 h-3.5 text-indigo-600" />,
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    STUDENT: {
      label: 'Sinh viên STU',
      icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />,
      classes: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  };

  const current = roleConfig[cleanRole] || {
    label: cleanRole || 'Thành viên',
    icon: null,
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
        current.classes,
        className
      )}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}
