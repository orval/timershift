module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': 'var(--app-bg)',
        'app-bg-no-running': 'var(--app-bg-no-running)',
        'text-bright': 'var(--text-bright)',
        'text-default': 'var(--text-default)',
        'text-soft': 'var(--text-soft)',
        'text-muted': 'var(--text-muted)',
        'text-label': 'var(--text-label)',
        'text-icon-muted': 'var(--text-icon-muted)',
        'text-blue': 'var(--text-blue)',
        'text-red': 'rgb(var(--text-red-rgb) / <alpha-value>)',
        'text-red-light': 'var(--text-red-light)',
        'text-orange': 'rgb(var(--text-orange-rgb) / <alpha-value>)',
        'text-orange-light': 'var(--text-orange-light)',
        'text-green': 'rgb(var(--text-green-rgb) / <alpha-value>)',
        'text-green-light': 'var(--text-green-light)',
        'text-green-lighter': 'var(--text-green-lighter)',
        'text-strong': 'var(--text-strong)',
        'text-button': 'var(--text-button)',
        'white-low': 'var(--white-low)',
        'white-mid': 'var(--white-mid)',
        'white-high': 'var(--white-high)',
        'panel-bg': 'var(--panel-bg)',
        'panel-solid': 'var(--panel-solid)',
        'popover-bg': 'var(--popover-bg)',
        'toast-bg': 'var(--toast-bg)',
        'overlay-backdrop': 'var(--overlay-backdrop)',
        'slate-12': 'var(--slate-12)',
        'slate-20': 'var(--slate-20)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'reset-btn-bg': 'var(--reset-btn-bg)',
        'reset-btn-bg-hover': 'var(--reset-btn-bg-hover)',
        'reset-btn-border': 'var(--reset-btn-border)',
        'reset-btn-text': 'var(--reset-btn-text)',
        'reset-btn-text-hover': 'var(--reset-btn-text-hover)'
      },
      spacing: {
        '0.5': 'var(--space-0_5)',
        '1.5': 'var(--space-1_5)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        btn: 'var(--button-size)',
        'icon-sm': 'var(--icon-sm)',
        'icon-md': 'var(--icon-md)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)'
      },
      fontSize: {
        sm: 'var(--font-sm)',
        md: 'var(--font-md)',
        lg: 'var(--font-lg)',
        xl: 'var(--font-xl)',
        '2xl': 'var(--font-2xl)',
        display: 'var(--font-display)'
      },
      backgroundImage: {
        'app-gradient': 'var(--bg-gradient)',
        'transfer-active': 'var(--bg-gradient-transfer-active)'
      },
      boxShadow: {
        base: '0 var(--space-sm) var(--space-2xl) var(--shadow-base)',
        'action-glow': '0 0 0 1px rgb(var(--accent-rgb) / 0.35), 0 0 var(--space-md) rgb(var(--accent-rgb) / 0.45), 0 var(--space-sm) var(--space-2xl) var(--shadow-base)',
        dock: '0 10px 24px var(--shadow-base)',
        'inset-accent': 'inset 0 0 0 1px rgb(var(--accent-rgb) / 0.5)',
        'inset-border': 'inset 0 0 0 1px var(--border-default)',
        modal: '0 var(--space-2xl) 60px var(--shadow-strong)',
        panel: '0 var(--space-sm) 26px var(--shadow-base)',
        popover: '0 8px 18px var(--shadow-base)',
        'preset-active': '0 0 0 2px rgb(255 255 255 / 0.28), 0 8px 18px var(--shadow-base)',
        toast: '0 var(--space-md) 30px var(--shadow-base)',
        'button-hover': '0 var(--space-sm) 28px var(--shadow-base)',
        'timer-dragging': '0 var(--space-xs) var(--space-2xl) var(--border-default)',
        'timer-running': '0 var(--space-xs) var(--space-xl) rgb(var(--text-green-rgb) / 0.3), inset 0 1px 0 var(--white-low)',
        'timer-paused': '0 var(--space-xs) var(--space-xl) rgb(var(--text-orange-rgb) / 0.3), inset 0 1px 0 var(--white-low)',
        'timer-default': '0 var(--space-sm) 30px var(--shadow-deep), inset 0 1px 0 var(--white-low)'
      },
      maxHeight: {
        modal: 'calc(100svh - 48px)'
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(var(--space-xs))' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'toast-in': 'toast-in 180ms ease'
      }
    }
  },
  plugins: []
}
