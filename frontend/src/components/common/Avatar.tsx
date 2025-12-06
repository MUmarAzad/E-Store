import React from 'react';
import { User } from 'lucide-react';
import { cn, getInitials } from '@/utils/helpers';

export interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName,
  lastName,
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = getInitials(firstName || '', lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${firstName} ${lastName}`}
        className={cn(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  if (initials) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium',
          sizes[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-100 text-gray-500 flex items-center justify-center',
        sizes[size],
        className
      )}
    >
      <User className="h-1/2 w-1/2" />
    </div>
  );
};

export default Avatar;
