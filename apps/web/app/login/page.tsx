'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import AuthLayout from '@/components/auth/AuthLayout';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Suspense } from 'react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const callbackUrl = searchParams.get('callbackUrl');

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      showToast('Logged in successfully!', 'success');
      
      // Determine destination: callbackUrl > role-based default
      let destination = callbackUrl;
      
      if (!destination) {
        destination = (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? '/admin' : '/dashboard';
      }
      
      router.push(destination);
    } catch (error: any) {
      if (error.status === 401) {
        setError('email', { 
          type: 'manual', 
          message: "Your email or password isn't correct" 
        });
      } else {
        showToast(error.message || 'Invalid credentials.', 'error');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to your affiliate dashboard to track your earnings and referrals."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          placeholder="john@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />
        <div className="flex items-center justify-end">
          <a href="#" className="text-sm font-bold text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Login
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Welcome Back"
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthLayout>
    }>
      <LoginContent />
    </Suspense>
  );
}
