import { BrandLogo } from '@/components/brand-logo';

interface HeaderProps {
  label: string;
}
export function Header({ label }: HeaderProps) {
  return (
    <header className="flex w-full justify-center">
      <BrandLogo size="lg" className="m-10" />
    </header>
  );
}
