'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { signupSchema } from '@shared/index';
import { TopBanner, ButtonPrimary, TextInput, AuthFormCard, TextLink, CtaBlockRed } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_no: '',
    branch: '',
    cgpa: '',
    phone: '',
    resume_url: '',
    skillsString: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    // Prepare payload
    const skills = formData.skillsString
      ? formData.skillsString.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    const payload: Record<string, any> = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      roll_no: formData.roll_no,
      branch: formData.branch,
      cgpa: parseFloat(formData.cgpa) || undefined,
      phone: formData.phone,
      resume_url: formData.resume_url || null,
      skills,
    };

    // Client-side validation using shared Zod schema
    const validation = signupSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<any>('/auth/signup', payload);

      if (response.success) {
        setSuccessMessage('Registration successful! Redirecting to login page...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
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
    <div className="flex-1 flex flex-col bg-[#ffffff]">
      <TopBanner>
        STUDENT SIGNUP REGISTRATION SYSTEM v1.0 // ENTERPRISE GATEWAY
      </TopBanner>

      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-2xl">
          <AuthFormCard title="STUDENT REGISTRATION FORM">
            {/* Warning sticker: Max one CtaBlockRed per page */}
            <CtaBlockRed className="mb-[16px] flex flex-col gap-[8px]">
              <span className="font-helvetica text-heading-3 uppercase font-bold block">
                ★ DOMAIN RESTRICTION WARNING ★
              </span>
              <span className="font-times-new-roman text-body block">
                Your email address MUST match the college domain suffix. Non-college emails will be blocked by system security rules automatically.
              </span>
            </CtaBlockRed>

            <form onSubmit={handleSubmit} className="space-y-[16px]">
              {/* Messages */}
              {generalError && (
                <div className="border border-[#e91d2a] bg-[#e91d2a]/10 p-[12px] text-body-sm text-[#e91d2a] font-bold">
                  {generalError}
                </div>
              )}

              {successMessage && (
                <div className="border border-[#8e8a25] bg-[#b3bd95]/20 p-[12px] text-body-sm text-[#8e8a25] font-bold">
                  {successMessage}
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <TextInput
                  label="Full Name"
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Aarav Sharma"
                  disabled={isLoading}
                  error={errors['name']}
                />

                <TextInput
                  label="College Email Address"
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="aarav@college.edu"
                  disabled={isLoading}
                  error={errors['email']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <TextInput
                  label="Password"
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  error={errors['password']}
                />

                <TextInput
                  label="Roll Number"
                  id="roll_no"
                  type="text"
                  required
                  value={formData.roll_no}
                  onChange={handleChange}
                  placeholder="CS22B1001"
                  disabled={isLoading}
                  error={errors['roll_no']}
                />
              </div>

              {/* Academic Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <TextInput
                  label="Branch / Specialization"
                  id="branch"
                  type="text"
                  required
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  disabled={isLoading}
                  error={errors['branch']}
                />

                <TextInput
                  label="CGPA (Out of 10.0)"
                  id="cgpa"
                  type="number"
                  step="0.01"
                  required
                  value={formData.cgpa}
                  onChange={handleChange}
                  placeholder="9.20"
                  disabled={isLoading}
                  error={errors['cgpa']}
                />
              </div>

              {/* Phone & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <TextInput
                  label="Phone Number"
                  id="phone"
                  type="text"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  disabled={isLoading}
                  error={errors['phone']}
                />

                <TextInput
                  label="Skills (Comma-separated)"
                  id="skillsString"
                  type="text"
                  value={formData.skillsString}
                  onChange={handleChange}
                  placeholder="TypeScript, React, Node.js"
                  disabled={isLoading}
                  error={errors['skills']}
                />
              </div>

              {/* Submit Button */}
              <ButtonPrimary
                type="submit"
                disabled={isLoading}
                className="w-full mt-[8px]"
              >
                {isLoading ? 'SUBMITTING REGISTRATION...' : 'REGISTER STUDENT PROFILE'}
              </ButtonPrimary>
            </form>

            {/* Login Link */}
            <div className="mt-[20px] pt-[12px] border-t border-[#000000] text-center text-body-sm">
              Already have an account?{' '}
              <TextLink href="/login">
                Sign in to system
              </TextLink>
            </div>
          </AuthFormCard>
        </div>
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        © 1996 Placement Buddy Corporation. Secure student registrar system.
      </footer>
    </div>
  );
}
