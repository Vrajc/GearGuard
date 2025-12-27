import Image from 'next/image';

interface ColorfulIconProps {
  iconPath: string;
  alt: string;
  color?: 'pink' | 'teal' | 'yellow' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export default function ColorfulIcon({ 
  iconPath, 
  alt, 
  color = 'teal',
  size = 'md',
  animate = false,
  className = ''
}: ColorfulIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const wrapperSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div 
      className={`
        icon-wrapper 
        icon-wrapper-${color} 
        ${wrapperSizes[size]}
        ${className}
      `}
    >
      <img 
        src={iconPath} 
        alt={alt} 
        className={sizeClasses[size]}
      />
    </div>
  );
}
