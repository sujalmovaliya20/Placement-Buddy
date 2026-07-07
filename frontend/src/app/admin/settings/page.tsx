'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, RibbonCard, Footer } from '@/components/ui';

interface AdminAuthResponse {
  role: string;
  profile?: {
    google_connected?: boolean;
    google_token_expiry?: string | null;
  };
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Authenticate Admin and Fetch Connection Status
  const fetchStatus = useCallback(async () => {
    try {
      const authRes = await api.get<AdminAuthResponse>('/auth/me');
      if (!authRes.success || (authRes.data.role !== 'tpo' && authRes.data.role !== 'superadmin')) {
        toastError('Unauthorized: Access restricted to TPO administrators.');
        router.push('/login');
        return;
      }
      setIsAdmin(true);

      const profile = authRes.data.profile;
      setGoogleConnected(!!profile?.google_connected);
      setTokenExpiry(profile?.google_token_expiry || null);
    } catch (err) {
      toastError((err as Error).message || 'Failed to authenticate admin session.');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, toastError]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 2. Check for redirect query parameters (success or error messages from Google OAuth Callback)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_connected') {
      toastSuccess('Google account connected successfully for Google Forms API access.');
      // Clear URL parameters
      router.replace('/admin/settings');
      fetchStatus();
    } else if (error) {
      toastError(`Authentication failed: ${decodeURIComponent(error)}`);
      router.replace('/admin/settings');
    }
  }, [searchParams, fetchStatus, router, toastError, toastSuccess]);

  // 3. Initiate Connection Flow
  const handleConnect = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await api.get<{ url: string }>('/admin/google-auth/connect');
      if (res.success && res.data?.url) {
        // Redirect browser to Google Consent Screen
        window.location.href = res.data.url;
      } else {
        toastError('Failed to generate Google connection URL.');
        setIsProcessing(false);
      }
    } catch (err) {
      toastError((err as Error).message || 'An error occurred during Google connection.');
      setIsProcessing(false);
    }
  };

  // 4. Disconnect Flow
  const handleDisconnect = async () => {
    if (isProcessing) return;
    if (!window.confirm('Are you sure you want to disconnect your Google account? This will revoke access to Forms API parsing for private forms.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.delete<{ message: string }>('/admin/google-auth/disconnect');
      if (res.success) {
        toastSuccess('Google account disconnected successfully.');
        setGoogleConnected(false);
        setTokenExpiry(null);
      } else {
        toastError('Failed to disconnect Google account.');
      }
    } catch (err) {
      toastError((err as Error).message || 'An error occurred during disconnection.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-[#fcc20f] font-helvetica font-bold shadow-[6px_6px_0px_#000000] uppercase tracking-wider animate-pulse">
          LOADING ADMIN SETTINGS... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] text-[#000000]">
      <TopBanner>
        ADMINISTRATION PORTAL // SYSTEM SETTINGS
      </TopBanner>

      <main className="flex-1 p-[24px] max-w-2xl mx-auto w-full space-y-[24px]">
        {/* Navigation */}
        <div className="border-b-2 border-frame-ink pb-[16px] flex justify-between items-center">
          <Link href="/admin/drives">
            <ButtonSecondary
              className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              bgClassName="bg-canvas hover:bg-neutral-50"
              textClassName="text-ink font-bold uppercase tracking-wider"
              borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
              roundedClassName="rounded-none"
            >
              ← BACK TO DRIVES LIST
            </ButtonSecondary>
          </Link>
        </div>

        {/* Integration configuration */}
        <RibbonCard title="GOOGLE INTEGRATION (FORMS API)" variant="periwinkle">
          <div className="space-y-[16px]">
            <p className="font-times-new-roman text-body leading-relaxed">
              Google OAuth integration allows the Placement Buddy server to securely fetch metadata and question formats directly from the Google Forms API. This enables automatic field mapping for <strong>login-restricted</strong> or <strong>organization-internal</strong> recruitment forms.
            </p>

            <div className="border-2 border-[#000000] p-[16px] bg-white flex flex-col gap-[12px] shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center justify-between">
                <span className="font-helvetica font-bold text-caption uppercase text-ink">
                  Integration Status:
                </span>
                <span className={`font-helvetica text-ui-label font-bold px-[10px] py-[6px] border-2 border-black uppercase select-none shadow-[2px_2px_0px_#000000] ${
                  googleConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {googleConnected ? '★ CONNECTED' : '✗ NOT CONNECTED'}
                </span>
              </div>

              {googleConnected && tokenExpiry && (
                <div className="text-body-sm font-times-new-roman pt-[8px] border-t-2 border-dashed border-gray-300 text-ink/75">
                  <span className="font-bold">Token Expiry / Refresh Registry:</span>{' '}
                  {new Date(tokenExpiry).toLocaleString()}
                </div>
              )}
            </div>

            <div className="pt-[12px] flex flex-col gap-[12px]">
              {googleConnected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={isProcessing}
                  className="w-full font-helvetica text-ui-label font-bold px-[16px] py-[12px] border-2 border-frame-ink uppercase cursor-pointer select-none transition-all bg-[#ffebe8] hover:bg-[#ffd5cf] text-[#e91d2a] disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_#000000] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                >
                  {isProcessing ? 'PROCESSING...' : 'DISCONNECT GOOGLE ACCOUNT'}
                </button>
              ) : (
                <ButtonPrimary
                  onClick={handleConnect}
                  disabled={isProcessing}
                  className="w-full text-center transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                  bgClassName="bg-yellow-sticker"
                  textClassName="text-ink font-bold uppercase tracking-wider"
                  borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                  roundedClassName="rounded-none"
                >
                  {isProcessing ? 'GENERATING CONSENT LINK...' : 'CONNECT GOOGLE ACCOUNT'}
                </ButtonPrimary>
              )}
            </div>
          </div>
        </RibbonCard>

        {/* Informational help card */}
        <div className="border-2 border-dashed border-frame-ink p-[16px] bg-[#fffde8] text-body-sm font-times-new-roman space-y-[8px] shadow-[4px_4px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-[1px] hover:-translate-y-[1px]">
          <h4 className="font-bold uppercase text-caption">ⓘ Security &amp; Permissions Disclaimer</h4>
          <p className="leading-relaxed">
            Placement Buddy requests the <strong>forms.body.readonly</strong> scope. This permission is read-only and restricted exclusively to retrieving form questions. It does not allow reading form responses or modifying form structures. The refresh token is encrypted at rest using AES-256-GCM.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-tint-sage font-helvetica font-bold text-ink rounded-none shadow-[6px_6px_0px_#000000]">
          LOADING SETTINGS GATEWAY...
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
