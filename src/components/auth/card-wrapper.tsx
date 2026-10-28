'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { BackButton } from './back-button';
import { Header } from './header';

interface CardWrapperProps {
  children?: React.ReactNode;
  headerLabel?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
}

export function CardWrapper({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
}: CardWrapperProps) {
  return (
    <Card className="w-[420px] border-gm-line-strong shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* caution-tape strip */}
      <div className="gm-stripes h-[6px] w-full" aria-hidden />
      <CardHeader className="pt-7">
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      {backButtonHref && backButtonLabel && (
        <CardFooter className="flex justify-center pt-3">
          <BackButton label={backButtonLabel} backButtonHref={backButtonHref} />
        </CardFooter>
      )}
    </Card>
  );
}
