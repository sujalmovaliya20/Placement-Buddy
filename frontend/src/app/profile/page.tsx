'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, ApiError } from '@/lib/api';
import { updateProfileSchema } from '@shared/index';
import type { UpdateProfileInput } from '@shared/index';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard, TextLink } from '@/components/ui';

export default function ProfilePage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: '',
      phone: '',
      roll_no: '',
      branch: '',
      cgpa: undefined,
      resume_url: '',
      links: { github: '', linkedin: '', portfolio: '' },
    },
  });

  // Watch fields in real-time to compute progress
  const watchedName = watch('name');
  const watchedPhone = watch('phone');
  const watchedRollNo = watch('roll_no');
  const watchedBranch = watch('branch');
  const watchedCgpa = watch('cgpa');
  const watchedResumeUrl = watch('resume_url');
  const watchedGithub = watch('links.github');
  const watchedLinkedin = watch('links.linkedin');
  const watchedPortfolio = watch('links.portfolio');

  // Load existing profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get<any>('/students/me');
        if (response.success && response.data) {
          const p = response.data;
          setValue('name', p.name || '');
          setValue('phone', p.phone || '');
          setValue('roll_no', p.roll_no || '');
          setValue('branch', p.branch || '');
          setValue('cgpa', p.cgpa);
          setValue('resume_url', p.resume_url || '');
          setValue('links.github', p.links?.github || '');
          setValue('links.linkedin', p.links?.linkedin || '');
          setValue('links.portfolio', p.links?.portfolio || '');
        }
      } catch (err: any) {
        if (err instanceof ApiError && err.statusCode === 401) {
          router.push('/login?redirectTo=/profile');
        } else {
          setGeneralError('Failed to load profile data.');
        }
      }
    }
    fetchProfile();
  }, [setValue, router]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (watchedName) score += 15;
    if (watchedPhone) score += 15;
    if (watchedRollNo) score += 15;
    if (watchedBranch) score += 15;
    if (watchedCgpa !== undefined && watchedCgpa !== null && !isNaN(Number(watchedCgpa))) score += 15;
    if (watchedResumeUrl) score += 15;
    if (watchedGithub || watchedLinkedin || watchedPortfolio) score += 10;
    return score;
  };

  const completionPct = calculateCompletion();

  // Validate fields for current step before advancing
  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['name', 'phone']);
    } else if (step === 2) {
      isValid = await trigger(['roll_no', 'branch', 'cgpa']);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
      setGeneralError(null);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    setGeneralError(null);
  };

  // Handle PDF upload to backend Cloudinary endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setGeneralError('Only PDF files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGeneralError('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploading(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${baseUrl}/students/me/resume`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Upload failed.');
      }

      if (data.success && data.data?.resume_url) {
        setValue('resume_url', data.data.resume_url);
        setSuccessMessage('Resume uploaded successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit complete form
  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const response = await api.put<any>('/students/me', data);
      if (response.success) {
        setSuccessMessage('Profile saved successfully.');
        router.refresh();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Network error. Failed to save profile.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#ffffff] text-[#000000]">
      <TopBanner>
        STUDENT PROFILE BUILDER // SYSTEM REGISTRAR WIZARD -- STATUS: {completionPct}% COMPLETE
      </TopBanner>

      <main className="flex-1 p-[24px] max-w-3xl mx-auto w-full space-y-[24px]">
        {/* Navigation & Progress */}
        <div className="flex items-center justify-between border-b border-[#000000] pb-[12px]">
          <Link href="/dashboard">
            <ButtonSecondary>
              ← BACK TO DASHBOARD
            </ButtonSecondary>
          </Link>
          <div className="text-right font-times-new-roman text-body font-bold">
            COMPLETION: {completionPct}%
          </div>
        </div>

        {/* Wizard Card */}
        <RibbonCard title={`UPDATE DETAILS -- STEP ${step} OF 3`} variant="steel">
          {/* Messages */}
          {generalError && (
            <div className="border border-[#e91d2a] bg-[#e91d2a]/10 p-[12px] text-body-sm text-[#e91d2a] font-bold mb-[16px]">
              {generalError}
            </div>
          )}

          {successMessage && (
            <div className="border border-[#8e8a25] bg-[#b3bd95]/20 p-[12px] text-body-sm text-[#8e8a25] font-bold mb-[16px]">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                  1. Personal Information
                </h3>
                
                <TextInput
                  label="Full Name"
                  id="name"
                  type="text"
                  {...register('name')}
                  disabled={isLoading}
                  error={errors.name?.message}
                />

                <TextInput
                  label="Phone Number"
                  id="phone"
                  type="text"
                  placeholder="+91XXXXXXXXXX"
                  {...register('phone')}
                  disabled={isLoading}
                  error={errors.phone?.message}
                />
              </div>
            )}

            {/* Step 2: Academic Details */}
            {step === 2 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                  2. Academic Profile
                </h3>

                <TextInput
                  label="Roll Number"
                  id="roll_no"
                  type="text"
                  {...register('roll_no')}
                  disabled={isLoading}
                  error={errors.roll_no?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  <TextInput
                    label="Branch / Specialization"
                    id="branch"
                    type="text"
                    placeholder="e.g. Computer Science"
                    {...register('branch')}
                    disabled={isLoading}
                    error={errors.branch?.message}
                  />

                  <TextInput
                    label="CGPA"
                    id="cgpa"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 9.20"
                    {...register('cgpa')}
                    disabled={isLoading}
                    error={errors.cgpa?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Resume & Links */}
            {step === 3 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                  3. Resume & Social Links
                </h3>

                {/* PDF Resume Uploader */}
                <div className="space-y-[8px]">
                  <label className="block font-helvetica text-ui-label text-ink select-none font-bold">
                    Upload Resume
                  </label>
                  <div className="border border-dashed border-[#000000] p-[24px] text-center bg-[#ffffff] relative">
                    <label htmlFor="resume-upload" className="cursor-pointer font-helvetica text-button font-bold text-[#0000ee] underline block">
                      CLICK HERE TO SELECT PDF FILE
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        disabled={isUploading || isLoading}
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="font-times-new-roman text-body-sm text-[#000000] mt-[4px]">
                      PDF files only, maximum file size 5MB
                    </p>
                  </div>

                  {isUploading && (
                    <p className="font-times-new-roman text-body-sm text-[#e91d2a] font-bold animate-pulse">
                      Uploading resume file to Cloudinary CDN...
                    </p>
                  )}

                  {watchedResumeUrl && (
                    <div className="border border-[#000000] bg-tint-sage p-[8px] flex items-center justify-between text-body-sm font-times-new-roman mt-[8px]">
                      <span>★ Current PDF file successfully linked to profile.</span>
                      <a href={watchedResumeUrl} target="_blank" rel="noopener noreferrer" className="text-[#0000ee] underline font-bold">
                        [View Current Resume]
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Profiles */}
                <div className="space-y-[12px] pt-[8px]">
                  <h4 className="font-helvetica text-ui-label uppercase font-bold text-[#000000]">
                    Social Profiles (Optional)
                  </h4>

                  <TextInput
                    label="GitHub Profile URL"
                    id="github"
                    type="url"
                    placeholder="https://github.com/username"
                    {...register('links.github')}
                    disabled={isLoading}
                    error={errors.links?.github?.message}
                  />

                  <TextInput
                    label="LinkedIn Profile URL"
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    {...register('links.linkedin')}
                    disabled={isLoading}
                    error={errors.links?.linkedin?.message}
                  />

                  <TextInput
                    label="Personal Portfolio URL"
                    id="portfolio"
                    type="url"
                    placeholder="https://username.dev"
                    {...register('links.portfolio')}
                    disabled={isLoading}
                    error={errors.links?.portfolio?.message}
                  />
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex justify-between items-center pt-[16px] border-t border-[#000000] mt-[8px]">
              {step > 1 ? (
                <ButtonSecondary type="button" onClick={handlePrev} disabled={isLoading}>
                  PREVIOUS
                </ButtonSecondary>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <ButtonPrimary type="button" onClick={handleNext} disabled={isLoading}>
                  NEXT STEP →
                </ButtonPrimary>
              ) : (
                <ButtonPrimary type="submit" disabled={isLoading || isUploading}>
                  {isLoading ? 'SAVING PROFILE...' : 'SAVE ENTIRE PROFILE'}
                </ButtonPrimary>
              )}
            </div>

          </form>
        </RibbonCard>
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        Secure profile builder system. All transactions audited.
      </footer>
    </div>
  );
}
