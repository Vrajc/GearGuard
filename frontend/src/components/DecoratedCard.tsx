interface DecoratedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'colorful' | 'gradient';
  doodle?: 'star' | 'circle' | 'none';
  className?: string;
}

export default function DecoratedCard({ 
  children, 
  variant = 'default',
  doodle = 'none',
  className = ''
}: DecoratedCardProps) {
  const variantClasses = {
    default: 'odoo-card',
    colorful: 'odoo-card shadow-sm',
    gradient: 'odoo-card-colorful',
  };

  const doodleClass = doodle !== 'none' ? `doodle-${doodle}` : '';

  return (
    <div className={`${variantClasses[variant]} ${doodleClass} ${className}`}>
      {children}
    </div>
  );
}
