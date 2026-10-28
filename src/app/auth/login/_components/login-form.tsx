'use client';

import { CardWrapper } from '@/components/auth/card-wrapper';
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
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, LoginSchemaType } from '@/schemas/auth/login.schema';
import { loginAction } from '@/actions/auth/login.action';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

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
    defaultValues: {
      identifier: '',
      password: '',
    },
  });
  const onSubmit = (values: LoginSchemaType) => {
    setError(undefined);
    setSuccess(undefined);
  
    startTransition(() => {
      loginAction(values, callbackUrl || '')
        .then((data) => {
  
          if (data?.error) {
            setError(data.error);
          }
          if (data?.success) {
            setSuccess(data.success); // ✅ Ahora recibe un string en lugar de true
            router.push(data.redirectTo || '/');
          }
        })
        .catch((error) => {
          console.error("⚠️ Error en loginAction:", error);
          setError('Algo salió mal. Por favor intenta de nuevo.');
        });
    });
  };
  
  

  return (
    <CardWrapper
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email o usuario</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      disabled={isPending}
                      type={showPassword ? 'text' : 'password'}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                {/* <div className="flex justify-center">
                  <Button asChild size="sm" variant="link" className="px-0 font-normal">
                    <Link href="/auth/reset">Olvidaste tu contraseña?</Link>
                  </Button>
                </div> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button className="w-full" type="submit" disabled={isPending}>
            Iniciar sesión
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}