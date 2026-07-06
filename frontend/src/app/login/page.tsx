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
    <div className="flex-1 flex flex-col bg-tint-periwinkle">
      <TopBanner>
        SECURE LOGIN PORTAL // PLACEMENT BUDDY AUTHENTICATION SYSTEM
      </TopBanner>

      <div className="bg-tint-peach text-ink font-arial-black text-display uppercase font-black px-[16px] py-[24px] border-b border-frame-ink text-center select-none">
        WELCOME BACK
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-md">
          <AuthFormCard title="ACCOUNT SIGN-IN" accentBgClassName="bg-tint-sage" bgClassName="bg-frame-ink" textClassName="text-canvas">
            <form onSubmit={handleSubmit} className="space-y-[16px]">
              
              {/* General Error Message */}
              {generalError && (
                <div className="border border-[#e91d2a] bg-[#e91d2a]/10 p-[12px] text-body-sm text-[#e91d2a] font-bold">
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
                labelClassName="text-canvas"
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
                labelClassName="text-canvas"
              />

              {/* Submit Button */}
              <ButtonPrimary
                type="submit"
                disabled={isLoading}
                className="w-full mt-[8px]"
                bgClassName="bg-yellow-sticker"
                textClassName="text-ink"
                borderClassName="border-yellow-sticker"
              >
                {isLoading ? 'SIGNING IN...' : 'SUBMIT AUTHENTICATION'}
              </ButtonPrimary>
            </form>

            {/* Signup Link */}
            <div className="mt-[20px] pt-[12px] border-t border-canvas text-center text-body-sm">
              Don&apos;t have an account?{' '}
              <TextLink href="/signup">
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
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-tint-periwinkle">
        <div className="border border-[#000000] p-[24px] bg-tint-sage font-helvetica font-bold">
          LOADING LOGIN PORTAL...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
