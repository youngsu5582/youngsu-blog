"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Calendar, MapPin, Images as ImagesIcon, X } from "lucide-react";
import Image from "next/image";

// Leaflet 동적 임포트 (SSR 방지)
const ActivityMap = dynamic(() => import("./activity-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">지도 로딩 중...</p>
    </div>
  ),
});

interface ActivityData {
  title: {
    ko: string;
    en: string;
  };
  date: string;
  images: string[];
  description: {
    ko: string;
    en: string;
  };
  full_content: {
    ko: string;
    en: string;
  };
  latitude: number;
  longitude: number;
}

interface ActivitiesViewProps {
  activities: ActivityData[];
}

export function ActivitiesView({ activities }: ActivitiesViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

  // 날짜순 정렬 (최신순)
  const sortedActivities = useMemo(() => {
    return [...activities].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activities]);

  return (
    <div className="space-y-8">
      {/* 지도 섹션 */}
      <div className="rounded-lg overflow-hidden border border-border shadow-sm">
        <ActivityMap
          activities={sortedActivities}
          onMarkerClick={(index) => {
            setSelectedActivity(index);
            // 해당 활동으로 스크롤
            const element = document.getElementById(`activity-${index}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        />
      </div>

      {/* 타임라인 섹션 */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          활동 타임라인
        </h2>

        <div className="relative border-l-2 border-border/50 ml-3 space-y-8">
          {sortedActivities.map((activity, index) => {
            const isSelected = selectedActivity === index;
            return (
              <div
                key={index}
                id={`activity-${index}`}
                className={`relative pl-8 pb-8 transition-all ${
                  isSelected ? "bg-primary/5 dark:bg-primary/10 -ml-3 pl-11 pr-4 py-4 rounded-lg" : ""
                }`}
              >
                {/* 타임라인 점 */}
                <div
                  className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full border-2 border-background transition-colors ${
                    isSelected
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-primary/60"
                  }`}
                />

                {/* 날짜 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(activity.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                {/* 제목 */}
                <h3 className="text-lg font-semibold mb-2 theme-heading">
                  {activity.title.ko}
                </h3>

                {/* 위치 정보 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {activity.latitude.toFixed(5)}, {activity.longitude.toFixed(5)}
                  </span>
                </div>

                {/* 설명 */}
                <p className="text-sm text-muted-foreground mb-4">
                  {activity.description.ko}
                </p>

                {/* 상세 내용 */}
                {activity.full_content?.ko && (
                  <div
                    className="prose prose-sm prose-neutral dark:prose-invert max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: activity.full_content.ko }}
                  />
                )}

                {/* 이미지 갤러리 */}
                {activity.images && activity.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <ImagesIcon className="h-3 w-3" />
                      {activity.images.length}개의 사진
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activity.images.map((image, imgIndex) => (
                        <button
                          key={imgIndex}
                          onClick={() => setSelectedImage(image)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-105 group"
                        >
                          <Image
                            src={image}
                            alt={`${activity.title.ko} - ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 라이트박스 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="확대된 이미지"
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
