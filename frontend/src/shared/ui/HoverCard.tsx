import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { ReactNode } from 'react';

interface HoverCardProps {
  trigger: ReactNode;
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

export function HoverCard({
  trigger,
  children,
  openDelay = 300,
  closeDelay = 100,
  sideOffset = 8,
  align = 'center',
}: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardPrimitive.Trigger asChild>
        {trigger}
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-50 w-auto rounded-2xl bg-surface border-2 border-border/50 shadow-2xl backdrop-blur-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={sideOffset}
          align={align}
        >
          {children}
          <HoverCardPrimitive.Arrow className="fill-surface" />
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}

export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardContent = HoverCardPrimitive.Content;
export const HoverCardArrow = HoverCardPrimitive.Arrow;
