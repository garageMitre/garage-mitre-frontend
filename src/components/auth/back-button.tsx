'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BackButtonProps {
  label: string;
  backButtonHref: string;
}

export function BackButton({ label, backButtonHref }: BackButtonProps) {
  return (
    <Button
      asChild
      variant="link"
      size="sm"
      className="font-normal text-muted-foreground hover:text-gm-yellow"
    >
      <Link href={backButtonHref}>{label}</Link>
    </Button>
  );
}
