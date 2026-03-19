import { readFileSync } from "fs";
import { join } from "path";
import { ActivitiesView } from "@/components/activities/activities-view";

export const metadata = {
  title: "활동",
  description: "비개발 활동 기록",
};

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

export default function ActivitiesPage() {
  // 활동 데이터 로드
  const activitiesPath = join(process.cwd(), "public", "assets", "data", "activities.json");
  const activitiesData: ActivityData[] = JSON.parse(readFileSync(activitiesPath, "utf-8"));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">활동</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {activitiesData.length}개의 활동 기록
        </p>
      </div>

      <ActivitiesView activities={activitiesData} />
    </div>
  );
}
