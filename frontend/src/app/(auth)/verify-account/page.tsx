"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVerifyAccountMutation, useResendOtpMutation } from "@/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyAccountPage() {
  const router = useRouter();
  const [verifyAccount, { isLoading: isVerifying }] = useVerifyAccountMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setServerError("Please enter the full 6-digit OTP.");
      return;
    }
    setServerError("");
    try {
      const token = localStorage.getItem("verify_token") || "";
      await verifyAccount({ otp: Number(code), token }).unwrap();
      setSuccessMsg("Account verified! Redirecting to login…");
      localStorage.removeItem("verify_token");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setServerError(err?.data?.message || "Invalid or expired OTP.");
    }
  };

  const handleResend = async () => {
    setServerError("");
    try {
      const token = localStorage.getItem("verify_token") || "";
      await resendOtp({ token }).unwrap();
      setSuccessMsg("OTP resent to your email.");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setServerError(err?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className='w-full max-w-md space-y-8 text-center'>
      <div className='space-y-2'>
        <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
          <ShieldCheck className='w-7 h-7 text-primary' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>Verify your email</h1>
        <p className='text-muted-foreground text-sm'>
          We sent a 6-digit code to your email address. Enter it below.
        </p>
      </div>

      {serverError && (
        <Alert variant='destructive'>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert className='border-green-500 text-green-700 dark:text-green-400'>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* OTP Input */}
      <div className='flex justify-center gap-3' onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className='w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors'
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={isVerifying || otp.join("").length < 6}
        className='w-full'
      >
        {isVerifying ? (
          <>
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            Verifying…
          </>
        ) : (
          "Verify Account"
        )}
      </Button>

      <div className='text-sm text-muted-foreground'>
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={isResending}
            className='text-primary font-medium hover:underline disabled:opacity-50'
          >
            {isResending ? "Resending…" : "Resend OTP"}
          </button>
        ) : (
          <span>
            Resend OTP in <span className='text-foreground font-medium'>{countdown}s</span>
          </span>
        )}
      </div>
    </div>
  );
}
