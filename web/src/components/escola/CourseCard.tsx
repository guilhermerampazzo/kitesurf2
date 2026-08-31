'use client'
import Link from 'next/link'
import Image from 'next/image'
import { cn, formatPrice } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import type { Course } from '@/types/escola'

interface CourseCardProps {
  course: Course
  className?: string
}

export function CourseCard({ course, className }: CourseCardProps) {
  const thumb = course.thumbnail ?? '/imagens/kitesurf-card.webp'
  const lessonsCount = course._count?.lessons ?? course.totalLessons ?? 0

  return (
    <Link
      href={`/escola/curso/${course.id}`}
      className={cn('group card-soft overflow-hidden product-card-hover flex flex-col', className)}
    >
      <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
        <Image
          src={thumb}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={thumb.startsWith('/imagens') || thumb.startsWith('/uploads')}
        />
        {/* Price / free badge */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {course.isFree ? (
            <Badge variant="success">Gratuito</Badge>
          ) : (
            <Badge variant="sponsored">{formatPrice(course.price)}</Badge>
          )}
          {course.level && <Badge variant="onphoto" className="capitalize">{course.level}</Badge>}
        </div>
        <span className="trust-chip-icon absolute top-3 right-3 z-10 !w-8 !h-8">
          <Icon name="school" size={16} />
        </span>
        {course.category && (
          <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">
            {course.category.name}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">
          {course.title}
        </h3>
        {course.instructor && (
          <p className="text-body-md text-secondary mt-1 flex items-center gap-1.5">
            <Icon name="person" size={14} />
            <span className="truncate">{course.instructor.name}</span>
            {course.instructor.isVerified && (
              <Icon name="verified" filled size={14} className="text-primary shrink-0" />
            )}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-body-md text-secondary">
            <span className="flex items-center gap-1">
              <Icon name="menu_book" size={14} />
              {lessonsCount} {lessonsCount === 1 ? 'aula' : 'aulas'}
            </span>
            {course.rating > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="star" filled size={14} className="text-amber-400" />
                {course.rating.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
            Ver curso <Icon name="arrow_forward" size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}
