"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgetPasswordMutation } from "@/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgetPasswordPage() {
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await forgetPassword({ email: data.email }).unwrap();
      setSent(true);
    } catch (err: any) {
      setServerError(err?.data?.message || "Something went wrong. Try again.");
    }
  };

  if (sent) {
    return (
      <div className='w-full max-w-md space-y-6 text-center'>
        <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4'>
          <Mail className='w-7 h-7 text-green-600 dark:text-green-400' />
        </div>
        <h1 className='text-2xl font-bold'>Check your email</h1>
        <p className='text-muted-foreground text-sm'>
          We sent a password reset OTP to your email. Use it on the reset password page.
        </p>
        <Link href='/reset-password'>
          <Button className='w-full'>Continue to Reset Password</Button>
        </Link>
        <Link href='/login' className='block text-sm text-primary hover:underline'>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md space-y-8'>
      <div className='space-y-2'>
        <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
          <Mail className='w-7 h-7 text-primary' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>Forgot password?</h1>
        <p className='text-muted-foreground text-sm'>
          Enter your email and we'll send you a reset OTP.
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

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Sending…
            </>
          ) : (
            "Send Reset OTP"
          )}
        </Button>
      </form>

      <Link
        href='/login'
        className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to login
      </Link>
    </div>
  );
}
