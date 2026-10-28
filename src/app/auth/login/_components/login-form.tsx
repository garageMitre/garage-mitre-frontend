'use client';

import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

import { loginSchema, LoginSchemaType } from '@/schemas/auth/login.schema';
import { loginAction } from '@/actions/auth/login.action';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = (values: LoginSchemaType) => {
    setError(undefined);
    setSuccess(undefined);
    startTransition(() => {
      loginAction(values, callbackUrl || '')
        .then((data) => {
          if (data?.error) setError(data.error);
          if (data?.success) {
            setSuccess(data.success);
            router.push(data.redirectTo || '/');
          }
        })
        .catch((err) => {
          console.error('⚠️ Error en loginAction:', err);
          setError('No se pudo iniciar sesión. Intentá de nuevo.');
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>Email o usuario</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    disabled={isPending}
                    className="pl-9"
                    placeholder="juan.castro@garagemitre.ar"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel>Contraseña</FormLabel>
                <Link
                  href="/auth/reset"
                  className="text-[11px] font-medium text-gm-yellow hover:underline"
                >
                  Olvidé mi contraseña
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    disabled={isPending}
                    type={showPassword ? 'text' : 'password'}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-sm hover:bg-gm-surface-3"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormError message={error} />
        <FormSuccess message={success} />

        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={isPending}
        >
          <LogIn className="size-4" />
          Entrar al sistema
        </Button>
      </form>
    </Form>
  );
}
