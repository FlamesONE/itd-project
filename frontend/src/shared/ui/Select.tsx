import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  disabled = false,
  className,
  triggerClassName,
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={clsx(
          'inline-flex items-center justify-between gap-2',
          'min-w-[140px] px-3 py-2',
          'bg-surface-hover border border-theme rounded-lg',
          'text-sm font-medium text-theme',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-150',
          'hover:bg-surface-hover/80',
          'data-[state=open]:ring-2 data-[state=open]:ring-brand-primary/50',
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <SelectPrimitive.Value placeholder={placeholder}>
            {selectedOption?.label}
          </SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="w-4 h-4 text-muted transition-transform duration-200 data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={clsx(
            'z-[300] overflow-hidden',
            'bg-surface border border-theme rounded-xl shadow-xl',
            'min-w-[var(--radix-select-trigger-width)]',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} icon={option.icon}>
                {option.label}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function SelectItem({ value, children, icon, disabled }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={clsx(
        'relative flex items-center gap-2',
        'px-3 py-2.5 pr-8 rounded-lg',
        'text-sm font-medium text-theme',
        'cursor-pointer select-none outline-none',
        'transition-colors duration-100',
        'data-[highlighted]:bg-surface-hover',
        'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none'
      )}
    >
      {icon && <span className="text-muted">{icon}</span>}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="w-4 h-4 text-brand-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { SelectItem };
