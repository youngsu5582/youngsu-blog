export type TaxonomyField = "tags" | "categories";

export interface TaxonomyContentItem {
  repoPath: string;
  title?: string;
  tags?: string[];
  categories?: string[];
}

export interface TaxonomyUsageFile {
  repoPath: string;
  title: string;
}

export interface TaxonomyUsageSummary {
  value: string;
  count: number;
  files: TaxonomyUsageFile[];
}

export function normalizeTaxonomyValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function renameTaxonomyValues(values: string[], fromValue: string, toValue: string): string[] {
  const from = normalizeTaxonomyValue(fromValue);
  const to = normalizeTaxonomyValue(toValue);
  const next: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeTaxonomyValue(value);
    const candidate = normalized === from ? to : normalized;
    if (candidate && !next.includes(candidate)) {
      next.push(candidate);
    }
  });

  return next;
}

export function buildTaxonomySummary(
  items: TaxonomyContentItem[],
  field: TaxonomyField
): TaxonomyUsageSummary[] {
  const usage = new Map<string, TaxonomyUsageSummary>();

  items.forEach((item) => {
    const values = field === "tags" ? item.tags : item.categories;
    (values || []).forEach((rawValue) => {
      const value = normalizeTaxonomyValue(rawValue);
      if (!value) return;

      const current = usage.get(value) || { value, count: 0, files: [] };
      current.count += 1;
      current.files.push({ repoPath: item.repoPath, title: item.title || item.repoPath });
      usage.set(value, current);
    });
  });

  return Array.from(usage.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.value.localeCompare(b.value);
  });
}
