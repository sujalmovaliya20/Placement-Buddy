'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api, ApiError } from '@/lib/api';
import { loginSchema } from '@shared/index';
import type { LoginInput } from '@shared/index';
import { TopBanner, ButtonPrimary, TextInput, AuthFormCard, TextLink } from '@/components/ui';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setGeneralError(null);

    const payload: LoginInput = { email, password };

    // Client-side validation using shared Zod schema
    const validation = loginSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as 'email' | 'password';
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      // POST login request to backend auth endpoint
      const response = await api.post<{ role: string; name: string }>('/auth/login', payload);

      if (response.success) {
        const user = response.data;
        const targetRedirect = (user?.role === 'tpo' || user?.role === 'superadmin')
          ? '/admin/drives'
          : redirectTo;
        router.push(targetRedirect);
        router.refresh();
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Network error. Failed to connect to server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
      <TopBanner>
        SECURE LOGIN PORTAL // PLACEMENT BUDDY AUTHENTICATION SYSTEM
      </TopBanner>

      <div className="relative overflow-hidden bg-tint-peach text-ink font-arial-black text-display uppercase font-black px-[16px] py-[28px] border-b-2 border-frame-ink text-center select-none">
        {/* Retro diagonal warning/tape stripe pattern overlay */}
        <div className="absolute inset-0 opacity-[0.08] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000000_10px,#000000_20px)]" />
        <span className="relative z-10 tracking-wider drop-shadow-[1.5px_1.5px_0px_rgba(255,255,255,0.8)]">WELCOME BACK</span>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-md my-[20px] transition-transform duration-300 hover:scale-[1.01]">
          <AuthFormCard
            title="ACCOUNT SIGN-IN"
            accentBgClassName="bg-tint-periwinkle"
            bgClassName="bg-canvas"
            textClassName="text-ink"
            titleClassName="text-ink font-helvetica text-heading-2 font-bold uppercase tracking-wider"
          >
            <form onSubmit={handleSubmit} className="space-y-[16px] retro-auth-form">

              {/* General Error Message */}
              {generalError && (
                <div className="border-2 border-[#e91d2a] bg-[#e91d2a]/10 p-[12px] text-body-sm text-[#e91d2a] font-bold rounded-none shadow-[2px_2px_0px_rgba(233,29,42,0.15)]">
                  {generalError}
                </div>
              )}

              {/* Email Field */}
              <TextInput
                label="Email Address"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu or you@gmail.com"
                disabled={isLoading}
                error={errors.email}
              />

              {/* Password Field */}
              <TextInput
                label="Password"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                error={errors.password}
              />

              {/* Submit Button */}
              <ButtonPrimary
                type="submit"
                disabled={isLoading}
                className="w-full mt-[8px] transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-yellow-sticker"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                {isLoading ? 'SIGNING IN...' : 'SUBMIT AUTHENTICATION'}
              </ButtonPrimary>
            </form>

            {/* Signup Link */}
            <div className="mt-[20px] pt-[12px] border-t border-frame-ink text-center text-body-sm text-ink">
              Don&apos;t have an account?{' '}
              <TextLink
                href="/signup"
                colorClassName="text-link"
                className="font-bold hover:underline"
              >
                Register as student
              </TextLink>
            </div>
          </AuthFormCard>
        </div>
      </main>

      <footer className="border-t border-[#000000] bg-[#000000] text-[#ffffff] p-[16px] text-center font-helvetica text-heading-2 font-bold select-none">
        DEVLOPED BY SUJAL MOVALIYA @2026 ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-tint-sage font-helvetica font-bold text-ink rounded-none shadow-[6px_6px_0px_#000000]">
          LOADING LOGIN PORTAL...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
