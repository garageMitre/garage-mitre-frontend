import { Suspense } from 'react';
import { LoginForm } from '@/app/auth/login/_components/login-form';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
