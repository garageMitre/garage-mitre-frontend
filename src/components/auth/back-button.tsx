'use client';

import Link from 'next/link';
import { Button } from '../ui/button';

interface BackButtonProps {
  label: string;
  backButtonHref: string;
}

export function BackButton({ label, backButtonHref }: BackButtonProps) {
  return (
    <Link href={backButtonHref}>
      <Button variant="link" className="font-normal w-full" size="sm">
        {label}
      </Button>
    </Link>
  );
}
