import Link from "next/link";
import Image from "next/image";
import { Calendar, Star } from "lucide-react";

interface LibraryCardProps {
  title: string;
  slug: string;
  description: string;
  date: string;
  image?: string;
  mediaType: "book" | "movie";
  rating?: number;
}

export function LibraryCard({
  title,
  slug,
  description,
  date,
  image,
  mediaType,
  rating,
}: LibraryCardProps) {
  return (
    <Link href={`/library/${slug}`}>
      <article className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Cover Image */}
        <div className="aspect-[3/4] relative overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {mediaType === "book" ? "📚" : "🎬"}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2 flex-1 flex flex-col">
          {/* Media Type Badge */}
          <div>
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {mediaType === "book" ? "책" : "영화"}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              {description}
            </p>
          )}

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <Calendar className="h-3 w-3" />
            {new Date(date).toLocaleDateString("ko-KR")}
          </div>
        </div>
      </article>
    </Link>
  );
}
