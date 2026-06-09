"use client";

import Link from "next/link";
import { isPast, format } from "date-fns";
import { MoreHorizontal, Calendar, Users, Pencil, Trash2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Project, ProjectStatus } from "@/types";

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    class: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ON_HOLD: {
    label: "On Hold",
    class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  COMPLETED: {
    label: "Completed",
    class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  canManage: boolean;
}

export default function ProjectCard({ project, onEdit, onDelete, canManage }: ProjectCardProps) {
  const isOverdue = isPast(new Date(project.deadline)) && project.status !== "COMPLETED";

  const status = statusConfig[project.status];
  const taskCount = project._count?.tasks ?? 0;
  const memberCount = project.members?.length ?? 0;

  return (
    <div className='group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md'>
      {/* Header */}
      <div className='mb-3 flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-base font-semibold transition-colors group-hover:text-primary'>
            {project.name}
          </h3>

          {project.description && (
            <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{project.description}</p>
          )}
        </div>

        <div className='relative z-20 flex shrink-0 items-center gap-1'>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.class}`}
          >
            {status.label}
          </span>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align='end'>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>
                    <Eye className='mr-2 h-4 w-4' />
                    View Details
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit Project
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className='mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2'>
        <div className='text-center'>
          <p className='text-lg font-semibold'>{taskCount}</p>
          <p className='text-xs text-muted-foreground'>Tasks</p>
        </div>

        <div className='h-8 w-px bg-border' />

        <div className='text-center'>
          <p className='text-lg font-semibold'>{memberCount}</p>
          <p className='text-xs text-muted-foreground'>Members</p>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between border-t border-border/50 pt-2'>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Calendar className='h-3.5 w-3.5' />

          <span className={isOverdue ? "font-medium text-destructive" : ""}>
            {isOverdue && "Overdue · "}
            {format(new Date(project.deadline), "MMM d, yyyy")}
          </span>
        </div>

        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Users className='h-3.5 w-3.5' />
          <span>{memberCount} members</span>
        </div>
      </div>

      {/* Card Link Overlay */}
      <Link
        href={`/projects/${project.id}`}
        className='absolute inset-0 rounded-xl'
        aria-label={`View ${project.name}`}
      >
        <span className='sr-only'>View project</span>
      </Link>
    </div>
  );
}
