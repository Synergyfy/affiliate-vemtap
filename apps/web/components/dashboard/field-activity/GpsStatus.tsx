'use client';

import { CheckCircle2, AlertCircle, WifiOff, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import { GpsVerificationStatus } from '@/types/field-activity';
import { cn } from '@/lib/utils';

interface GpsStatusBadgeProps {
  status: GpsVerificationStatus;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<GpsVerificationStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  VERIFIED: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Location Verified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CHECKING: { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Verifying Location...', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  PERMISSION_DENIED: { icon: <ShieldAlert className="w-4 h-4" />, label: 'Permission Denied', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  UNAVAILABLE: { icon: <MapPin className="w-4 h-4" />, label: 'GPS Unavailable', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  NETWORK_ERROR: { icon: <WifiOff className="w-4 h-4" />, label: 'Network Error', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  NOT_STARTED: { icon: <MapPin className="w-4 h-4" />, label: 'Not Started', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-[10px] gap-1',
  md: 'px-3 py-1.5 text-xs gap-1.5',
  lg: 'px-4 py-2 text-sm gap-2',
};

export function GpsStatusBadge({ status, className, showLabel = true, size = 'md' }: GpsStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center font-semibold border rounded-xl transition-colors', config.bg, config.color, sizeClasses[size], className)}>
      <span className={cn(config.color)}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface GpsStatusCardProps {
  status: GpsVerificationStatus;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function GpsStatusCard({ status, onRetry, onOpenSettings, className }: GpsStatusCardProps) {
  const config = statusConfig[status];

  if (status === 'VERIFIED' || status === 'NOT_STARTED') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-xl border', config.bg.replace('bg-', 'bg-').replace('border-', 'border-'), className)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg, config.color)}>
          {config.icon}
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{config.label}</p>
          {status === 'VERIFIED' && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Location captured successfully</p>}
        </div>
      </div>
    );
  }

  const actionButtons = status === 'PERMISSION_DENIED' && onOpenSettings ? (
    <button onClick={onOpenSettings} className="mt-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-200">
      Open Settings
    </button>
  ) : onRetry ? (
    <button onClick={onRetry} className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200">
      Retry
    </button>
  ) : null;

  return (
    <div className={cn('p-4 rounded-xl border', config.bg.replace('bg-', 'bg-').replace('border-', 'border-'), className)}>
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg, config.color)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{config.label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {status === 'CHECKING' && 'Please wait while we verify your location'}
            {status === 'PERMISSION_DENIED' && 'Enable location permission in browser settings to continue'}
            {status === 'UNAVAILABLE' && 'Unable to access GPS. Move to an open area and try again.'}
            {status === 'NETWORK_ERROR' && 'Network error. Check your connection and try again.'}
          </p>
          {actionButtons}
        </div>
      </div>
    </div>
  );
}