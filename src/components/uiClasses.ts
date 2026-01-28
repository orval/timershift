export const modalOverlayClass =
  'fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop p-2xl'

export const modalShellBaseClass =
  'w-full rounded-lg border border-white-mid bg-panel-solid p-xl shadow-modal max-h-modal overflow-y-auto'

export const buttonSecondaryClass =
  'rounded-md border border-white-high bg-white-mid px-sm py-xs text-md font-semibold text-text-default transition-[background,color,transform] duration-150 hover:bg-white-high active:translate-y-[1px]'

export const buttonPrimaryClass =
  'rounded-md border border-accent/60 bg-accent/[0.18] px-sm py-xs text-md font-semibold text-text-default transition-[background,color,transform] duration-150 hover:bg-accent/[0.28] active:translate-y-[1px]'

export const buttonPrimaryDisabledClass =
  `${buttonPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60`
