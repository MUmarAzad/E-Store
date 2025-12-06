import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import { cn } from '@/utils/helpers';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        {icon || (
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>}
      {renderAction()}
    </div>
  );
};

export default EmptyState;
