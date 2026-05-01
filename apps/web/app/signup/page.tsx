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
  location: z.string().min(2, 'Location is required'),
  address: z.string().min(5, 'Full address is required'),
  otpCode: z.string().min(6, 'Verification code must be 6 digits').optional(),
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

  const verifyOtp = async (email: string, code: string) => {
    // Mock OTP verification for development
    console.log(`Verifying OTP ${code} for ${email}`);
    return true;
  };
  const refCode = searchParams.get('ref');

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
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

  const handleNext = async () => {
    const fieldsToValidate = ['fullName', 'email', 'phone', 'password', 'confirmPassword', 'referralCode'] as const;
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
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
        id: `USER-${Math.floor(Math.random() * 10000)}`,
        fullName: data.fullName,
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        referralCode: data.referralCode || 'REF12345',
        location: data.location,
        address: data.address,
      } as any);
      setIsLoading(false);
      setShowTerms(true);
    } catch (error) {
      showToast('Failed to create account.', 'error');
      console.error('Signup error:', error);
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
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <span className="text-xs font-semibold mt-2 text-slate-600">Basics</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <span className="text-xs font-semibold mt-2 text-slate-600">Location</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
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
            <Button type="button" onClick={handleNext} className="w-full mt-6">
              Next Step
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Input
              label="City / Location"
              description="The primary city where you operate"
              placeholder="Lagos, Nigeria"
              {...register('location')}
              error={errors.location?.message}
            />
            <Input
              label="Full Address"
              description="Your complete residential or office address"
              placeholder="123 Business Street, Victoria Island"
              {...register('address')}
              error={errors.address?.message}
            />
            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                Back
              </Button>
              <Button type="submit" className="w-2/3" isLoading={isLoading}>
                Complete Signup
              </Button>
            </div>
          </div>
        )}
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
