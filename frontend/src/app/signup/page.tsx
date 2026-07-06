'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { signupSchema } from '@shared/index';
import { z } from 'zod';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, AuthFormCard, TextLink } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    contact_number: '',
    present_address: '',
    course: '',
    enrollment_number: '',
    tenth_result: '',
    twelfth_result: '',
    cgpa_previous_semester: '',
    sem1_sgpa: '',
    sem2_sgpa: '',
    sem3_sgpa: '',
    sem4_sgpa: '',
    sem5_sgpa: '',
    sem6_sgpa: '',
    sem7_sgpa: '',
    sem8_sgpa: '',
    experience_months: '0',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const getPayload = () => {
    return {
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      contact_number: formData.contact_number,
      email: formData.email,
      present_address: formData.present_address,
      password: formData.password,
      course: formData.course,
      enrollment_number: formData.enrollment_number,
      tenth_result: formData.tenth_result ? parseFloat(formData.tenth_result) : undefined,
      twelfth_result: formData.twelfth_result ? parseFloat(formData.twelfth_result) : undefined,
      cgpa_previous_semester: formData.cgpa_previous_semester ? parseFloat(formData.cgpa_previous_semester) : undefined,
      sem1_sgpa: formData.sem1_sgpa === '' ? null : formData.sem1_sgpa ? parseFloat(formData.sem1_sgpa) : null,
      sem2_sgpa: formData.sem2_sgpa === '' ? null : formData.sem2_sgpa ? parseFloat(formData.sem2_sgpa) : null,
      sem3_sgpa: formData.sem3_sgpa === '' ? null : formData.sem3_sgpa ? parseFloat(formData.sem3_sgpa) : null,
      sem4_sgpa: formData.sem4_sgpa === '' ? null : formData.sem4_sgpa ? parseFloat(formData.sem4_sgpa) : null,
      sem5_sgpa: formData.sem5_sgpa === '' ? null : formData.sem5_sgpa ? parseFloat(formData.sem5_sgpa) : null,
      sem6_sgpa: formData.sem6_sgpa === '' ? null : formData.sem6_sgpa ? parseFloat(formData.sem6_sgpa) : null,
      sem7_sgpa: formData.sem7_sgpa === '' ? null : formData.sem7_sgpa ? parseFloat(formData.sem7_sgpa) : null,
      sem8_sgpa: formData.sem8_sgpa === '' ? null : formData.sem8_sgpa ? parseFloat(formData.sem8_sgpa) : null,
      experience_months: formData.experience_months ? parseInt(formData.experience_months, 10) : 0,
    };
  };

  const validateStep = (currentStep: number) => {
    setErrors({});
    let stepSchema;
    if (currentStep === 1) {
      stepSchema = z.object({
        first_name: signupSchema.shape.first_name,
        last_name: signupSchema.shape.last_name,
        date_of_birth: signupSchema.shape.date_of_birth,
        contact_number: signupSchema.shape.contact_number,
        email: signupSchema.shape.email,
        present_address: signupSchema.shape.present_address,
        password: signupSchema.shape.password,
      });
    } else if (currentStep === 2) {
      stepSchema = z.object({
        course: signupSchema.shape.course,
        enrollment_number: signupSchema.shape.enrollment_number,
        tenth_result: signupSchema.shape.tenth_result,
        twelfth_result: signupSchema.shape.twelfth_result,
        cgpa_previous_semester: signupSchema.shape.cgpa_previous_semester,
      });
    } else if (currentStep === 3) {
      stepSchema = z.object({
        sem1_sgpa: signupSchema.shape.sem1_sgpa,
        sem2_sgpa: signupSchema.shape.sem2_sgpa,
        sem3_sgpa: signupSchema.shape.sem3_sgpa,
        sem4_sgpa: signupSchema.shape.sem4_sgpa,
        sem5_sgpa: signupSchema.shape.sem5_sgpa,
        sem6_sgpa: signupSchema.shape.sem6_sgpa,
        sem7_sgpa: signupSchema.shape.sem7_sgpa,
        sem8_sgpa: signupSchema.shape.sem8_sgpa,
      });
    } else {
      stepSchema = z.object({
        experience_months: signupSchema.shape.experience_months,
      });
    }

    const payload = getPayload();
    const res = stepSchema.safeParse(payload);
    if (!res.success) {
      const fieldErrors: Record<string, string> = {};
      res.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      setGeneralError(null);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateStep(4)) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    const payload = getPayload();

    try {
      const response = await api.post<Record<string, unknown>>('/auth/signup', payload);

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
    <div className="flex-1 flex flex-col bg-tint-periwinkle">
      <TopBanner>
        STUDENT SIGNUP REGISTRATION SYSTEM v1.0 // ENTERPRISE GATEWAY
      </TopBanner>

      <div className="bg-tint-salmon text-ink font-arial-black text-display uppercase font-black px-[16px] py-[24px] border-b border-frame-ink text-center select-none">
        JOIN THE PLACEMENT DRIVE
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-2xl">
          <AuthFormCard
            title={`STUDENT REGISTRATION FORM -- STEP ${step} OF 4`}
            accentBgClassName={
              step === 1 ? 'bg-tint-sage' :
              step === 2 ? 'bg-tint-lime' :
              step === 3 ? 'bg-tint-sky' :
              'bg-tint-peach'
            }
            bgClassName="bg-frame-ink"
            textClassName="text-canvas"
          >

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

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-[16px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                    <TextInput
                      label="First Name"
                      id="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Aarav"
                      disabled={isLoading}
                      error={errors['first_name']}
                    />

                    <TextInput
                      label="Last Name"
                      id="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Sharma"
                      disabled={isLoading}
                      error={errors['last_name']}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                    <TextInput
                      label="Date of Birth"
                      id="date_of_birth"
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      disabled={isLoading}
                      error={errors['date_of_birth']}
                    />

                    <TextInput
                      label="Contact Number"
                      id="contact_number"
                      type="text"
                      required
                      value={formData.contact_number}
                      onChange={handleChange}
                      placeholder="9876543210"
                      disabled={isLoading}
                      error={errors['contact_number']}
                    />
                  </div>

                  <TextInput
                    label="Email Address (College or Gmail)"
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="aarav@college.edu or user@gmail.com"
                    disabled={isLoading}
                    error={errors['email']}
                  />

                  {/* Problem 2 - Compact yellow-sticker warning inline under email */}
                  <div className="bg-yellow-sticker text-ink border border-[#000000] p-[8px] flex flex-col gap-[4px] select-none">
                    <span className="font-helvetica text-button uppercase font-bold">
                      ★ Domain Restriction Notice
                    </span>
                    <span className="font-times-new-roman text-body-sm">
                      Your email must be a valid Gmail address (@gmail.com) or match the college domain suffix (@college.edu).
                    </span>
                  </div>

                  <TextInput
                    label="Present Address"
                    id="present_address"
                    type="text"
                    required
                    value={formData.present_address}
                    onChange={handleChange}
                    placeholder="123, Hostel 4, College Campus"
                    disabled={isLoading}
                    error={errors['present_address']}
                  />

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
                </div>
              )}

              {/* Step 2: Academic Info */}
              {step === 2 && (
                <div className="space-y-[16px]">
                  <TextInput
                    label="Course"
                    id="course"
                    type="text"
                    required
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="B.Tech Computer Engineering"
                    disabled={isLoading}
                    error={errors['course']}
                  />

                  <TextInput
                    label="Enrollment Number"
                    id="enrollment_number"
                    type="text"
                    required
                    value={formData.enrollment_number}
                    onChange={handleChange}
                    placeholder="2026BCS001"
                    disabled={isLoading}
                    error={errors['enrollment_number']}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
                    <TextInput
                      label="10th Percentage"
                      id="tenth_result"
                      type="number"
                      step="0.01"
                      required
                      value={formData.tenth_result}
                      onChange={handleChange}
                      placeholder="e.g. 92.50"
                      disabled={isLoading}
                      error={errors['tenth_result']}
                    />

                    <TextInput
                      label="12th Percentage"
                      id="twelfth_result"
                      type="number"
                      step="0.01"
                      required
                      value={formData.twelfth_result}
                      onChange={handleChange}
                      placeholder="e.g. 88.20"
                      disabled={isLoading}
                      error={errors['twelfth_result']}
                    />

                    <TextInput
                      label="CGPA (Prev Semester)"
                      id="cgpa_previous_semester"
                      type="number"
                      step="0.01"
                      required
                      value={formData.cgpa_previous_semester}
                      onChange={handleChange}
                      placeholder="e.g. 8.50"
                      disabled={isLoading}
                      error={errors['cgpa_previous_semester']}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Semester SGPA */}
              {step === 3 && (
                <div className="space-y-[16px]">
                  <h4 className="font-helvetica text-heading-3 uppercase font-bold text-center mb-[8px]">
                    Semester-wise SGPA
                  </h4>
                  <p className="font-times-new-roman text-body-sm text-center text-gray-500 mb-[16px]">
                    Leave blank if not yet completed.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                    <TextInput
                      label="Semester 1 SGPA"
                      id="sem1_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem1_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem1_sgpa']}
                    />
                    <TextInput
                      label="Semester 2 SGPA"
                      id="sem2_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem2_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem2_sgpa']}
                    />
                    <TextInput
                      label="Semester 3 SGPA"
                      id="sem3_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem3_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem3_sgpa']}
                    />
                    <TextInput
                      label="Semester 4 SGPA"
                      id="sem4_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem4_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem4_sgpa']}
                    />
                    <TextInput
                      label="Semester 5 SGPA"
                      id="sem5_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem5_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem5_sgpa']}
                    />
                    <TextInput
                      label="Semester 6 SGPA"
                      id="sem6_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem6_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem6_sgpa']}
                    />
                    <TextInput
                      label="Semester 7 SGPA"
                      id="sem7_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem7_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem7_sgpa']}
                    />
                    <TextInput
                      label="Semester 8 SGPA"
                      id="sem8_sgpa"
                      type="number"
                      step="0.01"
                      value={formData.sem8_sgpa}
                      onChange={handleChange}
                      placeholder="SGPA"
                      disabled={isLoading}
                      error={errors['sem8_sgpa']}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Experience & Resume */}
              {step === 4 && (
                <div className="space-y-[16px]">
                  <TextInput
                    label="Experience in months (if any)"
                    id="experience_months"
                    type="number"
                    value={formData.experience_months}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={isLoading}
                    error={errors['experience_months']}
                  />

                  <div className="space-y-[8px] pt-[8px]">
                    <label className="block font-helvetica text-ui-label text-canvas select-none font-bold">
                      Upload Resume
                    </label>
                    <div className="border border-dashed border-[#000000] p-[24px] text-center bg-[#f9f9f9] relative">
                      <p className="font-helvetica text-button font-bold text-gray-500">
                        RESUME UPLOAD WILL BE AVAILABLE
                      </p>
                      <p className="font-times-new-roman text-body-sm text-[#000000] mt-[4px]">
                        Please complete registration first. You will be able to upload your PDF resume from your Profile dashboard after logging in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex justify-between items-center pt-[16px] border-t border-canvas mt-[8px]">
                {step > 1 ? (
                  <ButtonSecondary type="button" onClick={handlePrev} disabled={isLoading}>
                    PREVIOUS
                  </ButtonSecondary>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <ButtonPrimary
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    bgClassName="bg-yellow-sticker"
                    textClassName="text-ink"
                    borderClassName="border-yellow-sticker"
                  >
                    NEXT STEP →
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    type="submit"
                    disabled={isLoading}
                    bgClassName="bg-yellow-sticker"
                    textClassName="text-ink"
                    borderClassName="border-yellow-sticker"
                  >
                    {isLoading ? 'SUBMITTING REGISTRATION...' : 'REGISTER STUDENT PROFILE'}
                  </ButtonPrimary>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-[20px] pt-[12px] border-t border-canvas text-center text-body-sm">
              Already have an account?{' '}
              <TextLink href="/login">
                Sign in to system
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
