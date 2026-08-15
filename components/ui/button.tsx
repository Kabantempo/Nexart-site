import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { colors, radius, typography, transitions } from "@/lib/design-tokens"

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default:     { backgroundColor: colors.violet.primary, color: colors.text.onViolet },
  destructive: { backgroundColor: colors.feedback.danger.solid, color: colors.text.onDanger },
  outline:     { border: `2px solid ${colors.violet.primary}`, color: colors.violet.primary, backgroundColor: 'transparent' },
  secondary:   { backgroundColor: colors.bg.secondary, color: colors.text.primary },
  ghost:       { backgroundColor: 'transparent', color: colors.text.primary },
  link:        { backgroundColor: 'transparent', color: colors.violet.primary, textDecoration: 'underline', textUnderlineOffset: '4px' },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  default: { height: '40px', padding: '8px 16px' },
  sm:      { height: '36px', padding: '6px 12px', fontSize: '13px', borderRadius: radius.sm },
  lg:      { height: '44px', padding: '10px 32px', borderRadius: radius.sm },
  icon:    { height: '40px', width: '40px', padding: 0 },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ style, variant = 'default', size = 'default', asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          borderRadius: radius.sm,
          fontSize: typography.small.fontSize,
          fontWeight: 500,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: transitions.fast,
          fontFamily: typography.fontFamily,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : undefined,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
