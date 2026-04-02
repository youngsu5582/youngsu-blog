/**
 * Category-to-color mapping for visual distinction
 * Returns CSS custom property name for each category group
 */

export type CategoryColor = "blue" | "green" | "purple" | "amber" | "default";

interface CategoryColorMap {
  [key: string]: CategoryColor;
}

const categoryMap: CategoryColorMap = {
  // Backend/Spring/Java → blue (existing)
  백엔드: "blue",
  "Spring Boot": "blue",
  Spring: "blue",
  Java: "blue",
  "Java Performance": "blue",
  JPA: "blue",
  "Message Queue": "blue",
  RabbitMQ: "blue",
  Kafka: "blue",

  // Good Code/Clean Code → green
  "Good Code": "green",
  클린코드: "green",
  "Clean Code": "green",
  리팩토링: "green",
  Refactoring: "green",
  "Design Pattern": "green",
  디자인패턴: "green",
  "Code Quality": "green",

  // Infrastructure/DevOps → purple
  인프라: "purple",
  Infrastructure: "purple",
  Docker: "purple",
  "CI/CD": "purple",
  배포: "purple",
  Deployment: "purple",
  Monitoring: "purple",
  DevOps: "purple",

  // Retrospective/Career → amber
  회고: "amber",
  Retrospective: "amber",
  Career: "amber",
  커리어: "amber",
  "Year in Review": "amber",
};

/**
 * Get color scheme for a category
 */
export function getCategoryColor(category: string): CategoryColor {
  return categoryMap[category] || "default";
}

/**
 * Get Tailwind classes for category color
 */
export function getCategoryColorClass(category: string): string {
  const color = getCategoryColor(category);

  switch (color) {
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30";
    case "green":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30";
    case "purple":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30";
    case "amber":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800/30";
  }
}

/**
 * Get tag color variant (subtle version for tag pills)
 */
export function getTagColorClass(tag: string): string {
  const color = getCategoryColor(tag);

  switch (color) {
    case "blue":
      return "bg-blue-500/8 text-blue-700 border-blue-500/15 hover:bg-blue-500/15 hover:border-blue-500/30 dark:text-blue-400 dark:bg-blue-400/8 dark:border-blue-400/15 dark:hover:bg-blue-400/15 dark:hover:border-blue-400/30";
    case "green":
      return "bg-green-500/8 text-green-700 border-green-500/15 hover:bg-green-500/15 hover:border-green-500/30 dark:text-green-400 dark:bg-green-400/8 dark:border-green-400/15 dark:hover:bg-green-400/15 dark:hover:border-green-400/30";
    case "purple":
      return "bg-purple-500/8 text-purple-700 border-purple-500/15 hover:bg-purple-500/15 hover:border-purple-500/30 dark:text-purple-400 dark:bg-purple-400/8 dark:border-purple-400/15 dark:hover:bg-purple-400/15 dark:hover:border-purple-400/30";
    case "amber":
      return "bg-amber-500/8 text-amber-700 border-amber-500/15 hover:bg-amber-500/15 hover:border-amber-500/30 dark:text-amber-400 dark:bg-amber-400/8 dark:border-amber-400/15 dark:hover:bg-amber-400/15 dark:hover:border-amber-400/30";
    default:
      // Keep default theme-tag styling
      return "";
  }
}
