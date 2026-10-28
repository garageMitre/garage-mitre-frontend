import { GarageMitreLogo } from '@/components/brand/logo';

interface HeaderProps {
  label?: string;
}

export function Header({ label }: HeaderProps) {
  return (
    <header className="w-full flex flex-col items-center gap-4 pb-2">
      <GarageMitreLogo size="md" withTagline />
      {label ? (
        <p className="text-sm text-muted-foreground text-center max-w-[280px]">
          {label}
        </p>
      ) : null}
    </header>
  );
}
