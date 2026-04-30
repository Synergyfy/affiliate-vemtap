'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import AuthLayout from '@/components/auth/AuthLayout';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup } = useAuth();
  const { showToast } = useToast();
  const refCode = searchParams.get('ref');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      referralCode: refCode || '',
    },
  });

  useEffect(() => {
    if (refCode) {
      setValue('referralCode', refCode);
    }
  }, [refCode, setValue]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      signup({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        referralCode: data.referralCode || 'REF12345',
      });
      showToast('Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (error) {
      showToast('Failed to create account.', 'error');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Phone Number"
        type="tel"
        placeholder="+234 800 000 0000"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
      </div>
      <Input
        label="Referral Code (Optional)"
        placeholder="REF12345"
        {...register('referralCode')}
        error={errors.referralCode?.message}
      />
      <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
        Create Account
      </Button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Join the Vemtap Affiliate Network"
      subtitle="Start earning 20% direct commission by referring businesses to Vemtap."
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkHref="/login"
    >
      <Suspense fallback={<div className="text-center p-8">Loading form...</div>}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
