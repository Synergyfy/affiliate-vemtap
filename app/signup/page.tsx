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
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  otpCode: z.string().length(4, 'Verification code must be 4 digits').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup, sendOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const refCode = searchParams.get('ref');

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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

  const handleSendOtp = async () => {
    const email = getValues('email');
    if (!email) {
      showToast('Please enter your email first', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendOtp(email);
      showToast('Verification code sent to your email', 'success');
      setStep('otp');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send verification code.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onFinalSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // 1. Verify OTP
      if (!data.otpCode) {
        throw new Error('Verification code is required');
      }
      await verifyOtp(data.email, data.otpCode);

      // 2. Complete Signup
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await signup({
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'Agent',
        referralCode: data.referralCode,
      });
      
      showToast('Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create account.';
      showToast(Array.isArray(message) ? message[0] : message, 'error');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600">
            We've sent a 4-digit verification code to <span className="font-bold text-slate-900">{getValues('email')}</span>
          </p>
          <button 
            type="button" 
            onClick={() => setStep('details')}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Change email address
          </button>
        </div>

        <Input
          label="Verification Code"
          placeholder="0000"
          maxLength={4}
          autoComplete="one-time-code"
          className="text-center text-2xl tracking-[1em] font-black"
          {...register('otpCode')}
          error={errors.otpCode?.message}
        />

        <div className="space-y-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Verify & Create Account
          </Button>
          
          <button 
            type="button" 
            onClick={handleSendOtp}
            className="w-full text-sm text-slate-500 font-medium hover:text-slate-900 transition-colors"
          >
            Didn't get a code? Resend
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-4">
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
        Send Verification Code
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
