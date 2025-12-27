interface HighlightTextProps {
  children: React.ReactNode;
  color?: 'yellow' | 'pink' | 'teal' | 'green';
  underline?: 'squiggle' | 'brush' | 'none';
  className?: string;
}

export default function HighlightText({ 
  children, 
  color = 'yellow',
  underline = 'none',
  className = ''
}: HighlightTextProps) {
  const highlightClass = `highlight-${color}`;
  const underlineClass = underline !== 'none' ? `underline-${underline}` : '';
  
  return (
    <span className={`${highlightClass} ${underlineClass} ${className}`}>
      {children}
    </span>
  );
}
