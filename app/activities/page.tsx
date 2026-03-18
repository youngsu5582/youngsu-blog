import { MapPin } from "lucide-react";

export const metadata = {
  title: "활동",
  description: "비개발 활동 기록",
};

export default function ActivitiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">활동</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          비개발 활동 기록
        </p>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-primary/10 dark:bg-primary/15 mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-medium mb-2">준비 중입니다</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          활동 타임라인, 지도 기반 기록 등 다양한 활동을 기록할 예정입니다.
        </p>
      </div>
    </div>
  );
}
