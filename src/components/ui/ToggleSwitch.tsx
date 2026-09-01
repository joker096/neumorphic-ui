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
}: ToggleSwitchProps) => {
  const handleToggle = () => {
    if (disabled) return;
    if (onToggle) onToggle();
    else if (onChange) onChange(!isOn);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      role="switch"
      aria-checked={isOn}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center justify-center my-[-10px] min-w-[var(--control-size-xl)] min-h-[var(--control-height-md)] transition-all cursor-pointer ${className || 'w-12 h-6'} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${disabled ? '' : 'active:scale-95'}`}
    >
      <div className={`relative w-full max-w-12 h-6 inline-flex items-center rounded-full border transition-all ${
        isOn
          ? 'bg-primary border-transparent'
          : 'bg-muted border-border'
      }`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all bg-background ${isOn ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </div>
  );

};
