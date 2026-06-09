"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSignInMutation } from "@/features/auth/authApi";
import { setCredentials } from "@/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const DEMO_CREDENTIALS = [
  { label: "Admin", email: "admin@taskflow.com", password: "123456" },
  { label: "Project Manager", email: "manager@taskflow.com", password: "123456" },
  { label: "Team Member", email: "member@taskflow.com", password: "123456" },
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signIn, { isLoading }] = useSignInMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const result = await signIn(data).unwrap();
      if (result.success && result.data) {
        // Store token in cookie via API response
        document.cookie = `accessToken=${result.data.accessToken}; path=/; max-age=${60 * 60 * 24}`;
        document.cookie = `userRole=${result.data.role}; path=/; max-age=${60 * 60 * 24}`;
        dispatch(
          setCredentials({
            user: {
              id: result.data.id,
              name: "",
              email: data.email,
              role: result.data.role,
              isActive: true,
              createdAt: "",
              updatedAt: "",
            },
            accessToken: result.data.accessToken,
          }),
        );
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.data?.message || "Sign in failed. Please try again.");
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
  };

  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold'>Welcome back</CardTitle>
        <CardDescription>Sign in to your TaskFlow account</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Demo credentials */}
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground font-medium'>Demo Login</p>
          <div className='flex gap-2 flex-wrap'>
            {DEMO_CREDENTIALS.map((cred) => (
              <Button
                key={cred.label}
                variant='outline'
                size='sm'
                type='button'
                onClick={() => fillDemo(cred.email, cred.password)}
                className='text-xs'
              >
                {cred.label}
              </Button>
            ))}
          </div>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>or continue with</span>
          </div>
        </div>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' placeholder='you@example.com' {...register("email")} />
            {errors.email && <p className='text-xs text-destructive'>{errors.email.message}</p>}
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='password'>Password</Label>
              <Link href='/forget-password' className='text-xs text-primary hover:underline'>
                Forgot password?
              </Link>
            </div>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? "text" : "password"}
                placeholder='••••••••'
                {...register("password")}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.password && (
              <p className='text-xs text-destructive'>{errors.password.message}</p>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sign In
          </Button>
        </form>

        <p className='text-center text-sm text-muted-foreground'>
          Don&apos;t have an account?{" "}
          <Link href='/register' className='text-primary hover:underline font-medium'>
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
