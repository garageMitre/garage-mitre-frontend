'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { BackButton } from './back-button';
import { Header } from './header';
import { Suspense } from 'react';

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
    <Card className="w-[400px] shadow-md">
      <CardHeader>
        <Header label={headerLabel || ""} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      {backButtonHref && backButtonLabel && (
        <CardFooter className="flex justify-center">
          <BackButton label={backButtonLabel} backButtonHref={backButtonHref} />
        </CardFooter>
      )}
    </Card>
  );
}
