"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useCreateProjectMutation, useUpdateProjectMutation } from "@/features/projects/projectApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine((d) => {
      return new Date(d) > new Date();
    }, "Deadline must be a future date"),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]),
});

type FormData = z.infer<typeof schema>;

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSuccess?: () => void;
}

export default function ProjectForm({ open, onClose, project, onSuccess }: ProjectFormProps) {
  const isEditing = !!project;
  const [createProject, { isLoading: isCreating, error: createError }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating, error: updateError }] = useUpdateProjectMutation();
  const isLoading = isCreating || isUpdating;
  const error: any = createError || updateError;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "ACTIVE" },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || "",
        deadline: format(new Date(project.deadline), "yyyy-MM-dd"),
        status: project.status,
      });
    } else {
      reset({ name: "", description: "", deadline: "", status: "ACTIVE" });
    }
  }, [project, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && project) {
        await updateProject({ id: project.id, body: { ...data } }).unwrap();
      } else {
        await createProject(data).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>
              {(error as any)?.data?.message || "Something went wrong."}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Project Name *</Label>
            <Input
              id='name'
              placeholder='e.g. E-Commerce Redesign'
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Brief description of the project…'
              rows={3}
              {...register("description")}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='deadline'>Deadline *</Label>
              <Input
                id='deadline'
                type='date'
                {...register("deadline")}
                className={errors.deadline ? "border-destructive" : ""}
              />
              {errors.deadline && (
                <p className='text-xs text-destructive'>{errors.deadline.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                defaultValue={project?.status || "ACTIVE"}
                onValueChange={(val) => setValue("status", val as FormData["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ACTIVE'>Active</SelectItem>
                  <SelectItem value='ON_HOLD'>On Hold</SelectItem>
                  <SelectItem value='COMPLETED'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  {isEditing ? "Saving…" : "Creating…"}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
