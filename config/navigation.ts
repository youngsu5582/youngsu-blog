import { Home, FileText, BookOpen, Library, MapPin, User, Tags, Archive, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const navigation: NavItem[] = [
  { name: "홈", href: "/", icon: Home },
  { name: "포스트", href: "/posts", icon: FileText, description: "기술 아티클" },
  { name: "아티클", href: "/articles", icon: BookOpen, description: "장문 기술 문서" },
  { name: "서재", href: "/library", icon: Library, description: "독서/영화 리뷰" },
  { name: "활동", href: "/activities", icon: MapPin, description: "비개발 활동 기록" },
  { name: "소개", href: "/about", icon: User },
];

export const taxonomyNavigation: NavItem[] = [
  { name: "아카이브", href: "/archives", icon: Clock, description: "연도별 타임라인" },
  { name: "카테고리", href: "/categories", icon: Archive },
  { name: "태그", href: "/tags", icon: Tags },
];
