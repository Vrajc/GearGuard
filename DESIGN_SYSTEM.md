# GearGuard Colorful Design System

This design system incorporates playful, hand-drawn style icons and colorful highlights inspired by Odoo's modern, friendly aesthetic.

## 🎨 Color Palette

Our vibrant color scheme includes:

- **Pink**: `#E3008C` - For energy and attention
- **Teal**: `#00A09D` - For trust and reliability
- **Yellow**: `#FFB900` - For optimism and highlights
- **Green**: `#7FBA00` - For success and health
- **Purple**: `#875A7B` - For primary branding

## 🖼️ Colorful Icons

Located in `/public/icons/`, all icons are hand-drawn SVG with:
- Vibrant colors
- Slight imperfections for a human touch
- Sparkle effects and decorative elements

### Available Icons

- `wrench.svg` - Equipment & tools (Teal & Yellow)
- `dashboard.svg` - Analytics & charts (Pink & multicolor)
- `team.svg` - People & collaboration (Multicolor)
- `calendar.svg` - Scheduling (Yellow & Pink)
- `clipboard.svg` - Tasks & requests (Green & Yellow)
- `heart.svg` - Health monitoring (Pink)
- `star.svg` - Success & achievements (Yellow)
- `gear.svg` - Settings (Purple)
- `bell.svg` - Notifications (Teal & Yellow)
- `lightning.svg` - Speed & performance (Yellow)
- `shield.svg` - Security (Green)
- `pin.svg` - Location (Pink)

### Usage

```tsx
import ColorfulIcon from '@/components/ColorfulIcon';

<ColorfulIcon 
  iconPath="/icons/wrench.svg"
  alt="Equipment"
  color="teal"
  size="md"
  animate={true}
/>
```

## ✨ CSS Classes

### Highlight Effects

Add colorful background highlights to text:

```tsx
<span className="highlight-yellow">Important text</span>
<span className="highlight-pink">Attention</span>
<span className="highlight-teal">Info</span>
<span className="highlight-green">Success</span>
```

### Hand-Drawn Underlines

```tsx
<span className="underline-squiggle">Wavy underline</span>
<span className="underline-brush">Brush stroke</span>
```

### Decorative Doodles

```tsx
<div className="doodle-star">Content with star</div>
<div className="doodle-circle">Content with circle</div>
```

### Playful Shadows

```tsx
<div className="shadow-colorful">Colorful layered shadow</div>
```

### Icon Wrappers

Colored backgrounds for icons:

```tsx
<div className="icon-wrapper icon-wrapper-pink">
  <img src="/icons/heart.svg" alt="Heart" />
</div>
```

Colors: `pink`, `teal`, `yellow`, `green`, `purple`

### Animations

```tsx
<div className="float-animation">Floating element</div>
<button className="wobble-hover">Wobbles on hover</button>
```

## 🎯 Components

### ColorfulIcon

```tsx
interface ColorfulIconProps {
  iconPath: string;
  alt: string;
  color?: 'pink' | 'teal' | 'yellow' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}
```

### HighlightText

```tsx
import HighlightText from '@/components/HighlightText';

<HighlightText color="yellow" underline="squiggle">
  Highlighted text
</HighlightText>
```

### DecoratedCard

```tsx
import DecoratedCard from '@/components/DecoratedCard';

<DecoratedCard variant="colorful" doodle="star">
  Card content
</DecoratedCard>
```

Variants:
- `default` - Standard card
- `colorful` - With colorful shadow
- `gradient` - Gradient border

Doodles:
- `none`
- `star` - Star decoration
- `circle` - Circle decoration

## 🎨 Buttons

Enhanced buttons with gradients and animations:

```tsx
<button className="odoo-button-primary">
  Primary Action
</button>

<button className="odoo-button-secondary">
  Secondary Action
</button>

<button className="odoo-button-primary wobble-hover">
  Fun Button
</button>
```

## 📋 Cards

```tsx
<div className="odoo-card shadow-colorful hover:-translate-y-1">
  <!-- Lifts on hover with colorful shadow -->
</div>

<div className="odoo-card-colorful">
  <!-- Gradient animated border -->
</div>
```

## 🎭 Best Practices

1. **Use sparingly**: Don't overwhelm - pick 1-2 highlights per section
2. **Consistent colors**: Match icon colors with their purpose
3. **Animate purposefully**: Use animations for important CTAs
4. **Maintain contrast**: Ensure text remains readable
5. **Responsive**: Test colorful elements on mobile

## 💡 Examples

### Feature Card
```tsx
<div className="odoo-card p-6 hover:shadow-colorful transition-all">
  <div className="icon-wrapper icon-wrapper-teal float-animation mb-4">
    <img src="/icons/wrench.svg" alt="Tools" className="w-10 h-10" />
  </div>
  <h3 className="text-xl font-semibold mb-2">
    <span className="highlight-teal">Equipment</span> Management
  </h3>
  <p>Track all your equipment seamlessly</p>
</div>
```

### Hero Section
```tsx
<h1 className="text-5xl font-bold mb-4">
  Welcome to <span className="highlight-pink underline-brush">GearGuard</span>
</h1>
<p className="text-xl mb-8">
  The <span className="underline-squiggle">best</span> way to manage maintenance
</p>
```

### CTA Section
```tsx
<div className="shadow-colorful p-12 rounded-lg doodle-star">
  <h2 className="text-3xl font-bold mb-4">
    Ready to <span className="highlight-yellow">Get Started</span>?
  </h2>
  <button className="odoo-button-primary wobble-hover">
    Start Free Trial
  </button>
</div>
```

## 🚀 Performance

- All icons are optimized SVG (< 5KB each)
- CSS animations use `transform` for smooth performance
- No external dependencies
- Gradients cached by browser

## 📱 Mobile Considerations

- Icons scale properly on small screens
- Touch-friendly hover states
- Animations reduced on `prefers-reduced-motion`
- Shadows adjusted for mobile viewports

---

**Happy decorating! 🎨✨**
