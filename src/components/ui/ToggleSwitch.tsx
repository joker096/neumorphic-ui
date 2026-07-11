type ToggleSwitchProps = {
  isOn?: boolean;
  onToggle?: () => void;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  title?: string;
};

export const ToggleSwitch = ({
  isOn = false,
  onToggle,
  checked,
  onChange,
  disabled,
  title,
  className = '',
}: ToggleSwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    disabled={disabled}
    onClick={() => {
      if (disabled) return;
      if (onToggle) onToggle();
      else if (onChange) onChange(!isOn);
    }}
    className={`relative inline-flex items-center rounded-full transition-all cursor-pointer border ${className || 'w-12 h-6'} ${
      isOn
        ? 'bg-[var(--toggle-active-bg)] border-transparent'
        : 'bg-[var(--toggle-inactive-bg)] border-[var(--toggle-inactive-border)]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${disabled ? '' : 'active:scale-95'}`}
  >
    <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all bg-[var(--toggle-thumb-bg)] ${isOn ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);
