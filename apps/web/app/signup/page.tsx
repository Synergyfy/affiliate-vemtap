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
import { useToast } from '@/hooks/toast';

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

import TermsAndConditionsModal from '@/components/auth/TermsAndConditionsModal';

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup, updateUser } = useAuth();
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
      await signup({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        referralCode: data.referralCode,
      });
      
      setShowTerms(true);
    } catch (error: any) {
      showToast(error.message || 'Failed to create account.', 'error');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    updateUser({ hasAcceptedTerms: true });
    setShowTerms(false);
    showToast('Account created successfully!', 'success');
    router.push('/dashboard');
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold">Sign up</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Input
              label="Full Name"
              description="Enter your legal first and last name"
              placeholder="John Doe"
              {...register('fullName')}
              error={errors.fullName?.message}
            />
            <Input
              label="Email Address"
              type="email"
              description="We will use this for account notifications"
              placeholder="john@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              type="tel"
              description="Please provide your primary contact number (WhatsApp preferred)"
              placeholder="+234 800 000 0000"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                description="Minimum 8 characters"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Confirm Password"
                type="password"
                description="Must match password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
            </div>
            <Input
              label="Referral Code (Optional)"
              description="The code provided by another agent, if you have one"
              placeholder="REF12345"
              {...register('referralCode')}
              error={errors.referralCode?.message}
            />
            <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
              Complete Signup
            </Button>
          </div>
      </form>

      <TermsAndConditionsModal
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
      />
    </>
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
