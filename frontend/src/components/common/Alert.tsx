import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type = 'info', title, message, className, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: Info,
    },
  };

  const Icon = styles[type].icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border flex items-start gap-3',
        styles[type].bg,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles[type].text)} />
      <div className="flex-1">
        {title && <h4 className={cn('font-medium mb-1', styles[type].text)}>{title}</h4>}
        <div className={cn('text-sm', styles[type].text)}>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn('p-1 rounded hover:bg-black/5', styles[type].text)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
