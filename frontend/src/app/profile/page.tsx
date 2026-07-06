'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, ApiError } from '@/lib/api';
import { updateProfileSchema } from '@shared/index';
import type { UpdateProfileInput, Student } from '@shared/index';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard } from '@/components/ui';

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
      first_name: '',
      last_name: '',
      date_of_birth: '',
      contact_number: '',
      present_address: '',
      course: '',
      enrollment_number: '',
      tenth_result: undefined,
      twelfth_result: undefined,
      cgpa_previous_semester: undefined,
      sem1_sgpa: null,
      sem2_sgpa: null,
      sem3_sgpa: null,
      sem4_sgpa: null,
      sem5_sgpa: null,
      sem6_sgpa: null,
      sem7_sgpa: null,
      sem8_sgpa: null,
      experience_months: 0,
      resume_url: '',
      links: { github: '', linkedin: '', portfolio: '' },
    },
  });

  // Watch fields in real-time to compute progress
  const watchedFirstName = watch('first_name');
  const watchedLastName = watch('last_name');
  const watchedDateOfBirth = watch('date_of_birth');
  const watchedContactNumber = watch('contact_number');
  const watchedPresentAddress = watch('present_address');
  const watchedCourse = watch('course');
  const watchedEnrollmentNumber = watch('enrollment_number');
  const watchedTenthResult = watch('tenth_result');
  const watchedTwelfthResult = watch('twelfth_result');
  const watchedCgpa = watch('cgpa_previous_semester');
  const watchedResumeUrl = watch('resume_url');


  // Load existing profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get<Student>('/students/me');
        if (response.success && response.data) {
          const p = response.data;
          setValue('first_name', p.first_name || '');
          setValue('last_name', p.last_name || '');
          if (p.date_of_birth) {
            const dob = new Date(p.date_of_birth).toISOString().split('T')[0] ?? '';
            setValue('date_of_birth', dob);
          } else {
            setValue('date_of_birth', '');
          }
          setValue('contact_number', p.contact_number || '');
          setValue('present_address', p.present_address || '');
          setValue('course', p.course || '');
          setValue('enrollment_number', p.enrollment_number || '');
          setValue('tenth_result', p.tenth_result);
          setValue('twelfth_result', p.twelfth_result);
          setValue('cgpa_previous_semester', p.cgpa_previous_semester);
          setValue('sem1_sgpa', p.sem1_sgpa ?? null);
          setValue('sem2_sgpa', p.sem2_sgpa ?? null);
          setValue('sem3_sgpa', p.sem3_sgpa ?? null);
          setValue('sem4_sgpa', p.sem4_sgpa ?? null);
          setValue('sem5_sgpa', p.sem5_sgpa ?? null);
          setValue('sem6_sgpa', p.sem6_sgpa ?? null);
          setValue('sem7_sgpa', p.sem7_sgpa ?? null);
          setValue('sem8_sgpa', p.sem8_sgpa ?? null);
          setValue('experience_months', p.experience_months || 0);
          setValue('resume_url', p.resume_url || '');
          setValue('links.github', p.links?.github || '');
          setValue('links.linkedin', p.links?.linkedin || '');
          setValue('links.portfolio', p.links?.portfolio || '');
        }
      } catch (err) {
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
    if (watchedFirstName) score += 10;
    if (watchedLastName) score += 10;
    if (watchedDateOfBirth) score += 10;
    if (watchedContactNumber) score += 10;
    if (watchedPresentAddress) score += 10;
    if (watchedCourse) score += 10;
    if (watchedEnrollmentNumber) score += 10;
    if (watchedTenthResult !== undefined && watchedTenthResult !== null && !isNaN(Number(watchedTenthResult))) score += 10;
    if (watchedTwelfthResult !== undefined && watchedTwelfthResult !== null && !isNaN(Number(watchedTwelfthResult))) score += 10;
    if (watchedCgpa !== undefined && watchedCgpa !== null && !isNaN(Number(watchedCgpa))) score += 10;
    return score;
  };

  const completionPct = calculateCompletion();

  // Validate fields for current step before advancing
  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['first_name', 'last_name', 'date_of_birth', 'contact_number', 'present_address']);
    } else if (step === 2) {
      isValid = await trigger(['course', 'enrollment_number', 'tenth_result', 'twelfth_result', 'cgpa_previous_semester']);
    } else if (step === 3) {
      isValid = await trigger(['sem1_sgpa', 'sem2_sgpa', 'sem3_sgpa', 'sem4_sgpa', 'sem5_sgpa', 'sem6_sgpa', 'sem7_sgpa', 'sem8_sgpa']);
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is missing.');
      }
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
    } catch (err) {
      setGeneralError((err as Error).message || 'Failed to upload file.');
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
      const response = await api.put<Record<string, unknown>>('/students/me', data);
      if (response.success) {
        setSuccessMessage('Profile saved successfully.');
        router.refresh();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
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
        <RibbonCard title={`UPDATE DETAILS -- STEP ${step} OF 4`} variant="steel">
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

          {Object.keys(errors).length > 0 && (
            <div className="border border-[#e91d2a] bg-[#e91d2a]/10 p-[12px] text-body-sm text-[#e91d2a] font-bold mb-[16px]">
              Please check the following validation errors:
              <ul className="list-disc list-inside mt-[4px] font-normal">
                {Object.entries(errors).map(([key, err]) => {
                  const label = key.replace(/_/g, ' ').replace('links.', 'Social Link: ').toUpperCase();
                  const message = (err as { message?: string })?.message || 'Invalid value';
                  return (
                    <li key={key}>
                      <span className="font-bold">{label}</span>: {message}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                  1. Personal Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                  <TextInput
                    label="First Name"
                    id="first_name"
                    type="text"
                    {...register('first_name')}
                    disabled={isLoading}
                    error={errors.first_name?.message}
                  />

                  <TextInput
                    label="Last Name"
                    id="last_name"
                    type="text"
                    {...register('last_name')}
                    disabled={isLoading}
                    error={errors.last_name?.message}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                  <TextInput
                    label="Date of Birth"
                    id="date_of_birth"
                    type="date"
                    {...register('date_of_birth')}
                    disabled={isLoading}
                    error={errors.date_of_birth?.message}
                  />

                  <TextInput
                    label="Contact Number"
                    id="contact_number"
                    type="text"
                    placeholder="9876543210"
                    {...register('contact_number')}
                    disabled={isLoading}
                    error={errors.contact_number?.message}
                  />
                </div>

                <TextInput
                  label="Present Address"
                  id="present_address"
                  type="text"
                  placeholder="123, Hostel 4, College Campus"
                  {...register('present_address')}
                  disabled={isLoading}
                  error={errors.present_address?.message}
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
                  label="Course"
                  id="course"
                  type="text"
                  placeholder="e.g. B.Tech Computer Engineering"
                  {...register('course')}
                  disabled={isLoading}
                  error={errors.course?.message}
                />

                <TextInput
                  label="Enrollment Number"
                  id="enrollment_number"
                  type="text"
                  placeholder="e.g. 2026BCS001"
                  {...register('enrollment_number')}
                  disabled={isLoading}
                  error={errors.enrollment_number?.message}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
                  <TextInput
                    label="10th Percentage"
                    id="tenth_result"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 92.50"
                    {...register('tenth_result')}
                    disabled={isLoading}
                    error={errors.tenth_result?.message}
                  />

                  <TextInput
                    label="12th Percentage"
                    id="twelfth_result"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 88.20"
                    {...register('twelfth_result')}
                    disabled={isLoading}
                    error={errors.twelfth_result?.message}
                  />

                  <TextInput
                    label="CGPA (Prev Semester)"
                    id="cgpa_previous_semester"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.50"
                    {...register('cgpa_previous_semester')}
                    disabled={isLoading}
                    error={errors.cgpa_previous_semester?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Semester SGPA */}
            {step === 3 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px] text-center">
                  3. Semester-wise SGPA
                </h3>
                <p className="font-times-new-roman text-body-sm text-center text-gray-500">
                  Leave blank if not yet completed.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                  <TextInput
                    label="Semester 1 SGPA"
                    id="sem1_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem1_sgpa')}
                    disabled={isLoading}
                    error={errors.sem1_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 2 SGPA"
                    id="sem2_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem2_sgpa')}
                    disabled={isLoading}
                    error={errors.sem2_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 3 SGPA"
                    id="sem3_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem3_sgpa')}
                    disabled={isLoading}
                    error={errors.sem3_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 4 SGPA"
                    id="sem4_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem4_sgpa')}
                    disabled={isLoading}
                    error={errors.sem4_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 5 SGPA"
                    id="sem5_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem5_sgpa')}
                    disabled={isLoading}
                    error={errors.sem5_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 6 SGPA"
                    id="sem6_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem6_sgpa')}
                    disabled={isLoading}
                    error={errors.sem6_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 7 SGPA"
                    id="sem7_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem7_sgpa')}
                    disabled={isLoading}
                    error={errors.sem7_sgpa?.message}
                  />
                  <TextInput
                    label="Semester 8 SGPA"
                    id="sem8_sgpa"
                    type="number"
                    step="0.01"
                    placeholder="SGPA"
                    {...register('sem8_sgpa')}
                    disabled={isLoading}
                    error={errors.sem8_sgpa?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Resume & Links */}
            {step === 4 && (
              <div className="space-y-[16px]">
                <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                  4. Resume & Experience
                </h3>

                <TextInput
                  label="Experience in months (if any)"
                  id="experience_months"
                  type="number"
                  placeholder="0"
                  {...register('experience_months')}
                  disabled={isLoading}
                  error={errors.experience_months?.message}
                />

                {/* PDF Resume Uploader */}
                <div className="space-y-[8px] pt-[8px]">
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

              {step < 4 ? (
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

      <footer className="border-t border-[#000000] bg-[#000000] text-[#ffffff] p-[16px] text-center font-helvetica text-heading-2 font-bold select-none">
        DEVLOPED BY SUJAL MOVALIYA @2026 ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
