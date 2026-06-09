"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPasswordMutation } from "@/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [serverError, setServerError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await resetPassword({
        otp: Number(data.otp),
        password: data.newPassword,
      }).unwrap();
      router.push("/login?reset=success");
    } catch (err: any) {
      setServerError(err?.data?.message || "Reset failed. Check your OTP and try again.");
    }
  };

  return (
    <div className='w-full max-w-md space-y-8'>
      <div className='space-y-2'>
        <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
          <KeyRound className='w-7 h-7 text-primary' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>Reset password</h1>
        <p className='text-muted-foreground text-sm'>
          Enter the OTP sent to your email and choose a new password.
        </p>
      </div>

      {serverError && (
        <Alert variant='destructive'>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email address</Label>
          <Input
            id='email'
            type='email'
            placeholder='john@example.com'
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className='text-xs text-destructive'>{errors.email.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='otp'>6-digit OTP</Label>
          <Input
            id='otp'
            inputMode='numeric'
            maxLength={6}
            placeholder='123456'
            {...register("otp")}
            className={
              errors.otp
                ? "border-destructive tracking-widest text-center"
                : "tracking-widest text-center"
            }
          />
          {errors.otp && <p className='text-xs text-destructive'>{errors.otp.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='newPassword'>New Password</Label>
          <div className='relative'>
            <Input
              id='newPassword'
              type={showNew ? "text" : "password"}
              placeholder='Min. 6 characters'
              {...register("newPassword")}
              className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
            />
            <button
              type='button'
              onClick={() => setShowNew(!showNew)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              {showNew ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
          {errors.newPassword && (
            <p className='text-xs text-destructive'>{errors.newPassword.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirm ? "text" : "password"}
              placeholder='Repeat new password'
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
            />
            <button
              type='button'
              onClick={() => setShowConfirm(!showConfirm)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className='text-xs text-destructive'>{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>

      <Link
        href='/login'
        className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground'
      >
        Back to login
      </Link>
    </div>
  );
}
