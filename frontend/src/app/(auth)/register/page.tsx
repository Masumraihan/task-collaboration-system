"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSignUpMutation } from "@/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["TEAM_MEMBER", "PROJECT_MANAGER", "ADMIN"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [signUp, { isLoading }] = useSignUpMutation();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "TEAM_MEMBER" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    try {
      const res = await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      }).unwrap();

      // Store token for verify-account page
      if (res?.data?.token) {
        localStorage.setItem("verify_token", res.data?.token);
      }
      router.push("/verify-account");
    } catch (err: any) {
      setServerError(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className='w-full max-w-md space-y-8'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
          <UserPlus className='w-7 h-7 text-primary' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>Create account</h1>
        <p className='text-muted-foreground text-sm'>Join your team on TaskFlow</p>
      </div>

      {serverError && (
        <Alert variant='destructive'>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        {/* Name */}
        <div className='space-y-2'>
          <Label htmlFor='name'>Full Name</Label>
          <Input
            id='name'
            placeholder='John Doe'
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='john@example.com'
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className='text-xs text-destructive'>{errors.email.message}</p>}
        </div>

        {/* Role */}
        <div className='space-y-2'>
          <Label>Role</Label>
          <Select
            defaultValue='TEAM_MEMBER'
            onValueChange={(val) => setValue("role", val as RegisterForm["role"])}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='TEAM_MEMBER'>Team Member</SelectItem>
              <SelectItem value='PROJECT_MANAGER'>Project Manager</SelectItem>
              <SelectItem value='ADMIN'>Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Password */}
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? "text" : "password"}
              placeholder='Min. 6 characters'
              {...register("password")}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
          {errors.password && <p className='text-xs text-destructive'>{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirm ? "text" : "password"}
              placeholder='Repeat password'
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
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        Already have an account?{" "}
        <Link href='/login' className='text-primary font-medium hover:underline'>
          Sign in
        </Link>
      </p>
    </div>
  );
}
