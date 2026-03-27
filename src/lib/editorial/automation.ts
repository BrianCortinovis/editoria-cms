import type { PlacementDisplayMode } from "@/lib/editorial/placements";

export interface EditorialCategoryAutomationRule {
  homepageSlotId: string | null;
  spotlightTagIds: string[];
  displayMode: PlacementDisplayMode;
}

export interface EditorialAutomationConfig {
  homepageFreshHours?: number;
  categoryRules?: Record<string, EditorialCategoryAutomationRule>;
}

export interface ResolveEditorialAutomationInput {
  categoryIds: string[];
  tagIds: string[];
  config: EditorialAutomationConfig | null | undefined;
}

export interface ResolvedEditorialAutomationRule {
  categoryId: string;
  homepageSlotId: string;
  spotlightTagId: string;
  displayMode: PlacementDisplayMode;
}

export function normalizeEditorialAutomationConfig(
  value: unknown
): EditorialAutomationConfig {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const categoryRulesRecord =
    record.categoryRules && typeof record.categoryRules === "object"
      ? (record.categoryRules as Record<string, unknown>)
      : {};

  const categoryRules = Object.fromEntries(
    Object.entries(categoryRulesRecord).map(([categoryId, ruleValue]) => {
      const rule = ruleValue && typeof ruleValue === "object" ? (ruleValue as Record<string, unknown>) : {};
      return [
        categoryId,
        {
          homepageSlotId:
            typeof rule.homepageSlotId === "string" && rule.homepageSlotId.trim()
              ? rule.homepageSlotId
              : null,
          spotlightTagIds: Array.isArray(rule.spotlightTagIds)
            ? rule.spotlightTagIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
            : [],
          displayMode: rule.displayMode === "exclusive" ? "exclusive" : "duplicate",
        } satisfies EditorialCategoryAutomationRule,
      ];
    })
  );

  return {
    homepageFreshHours:
      typeof record.homepageFreshHours === "number" && Number.isFinite(record.homepageFreshHours)
        ? record.homepageFreshHours
        : undefined,
    categoryRules,
  };
}

export function resolveEditorialAutomationRule(
  input: ResolveEditorialAutomationInput
): ResolvedEditorialAutomationRule | null {
  const config = normalizeEditorialAutomationConfig(input.config);

  for (const categoryId of input.categoryIds) {
    const rule = config.categoryRules?.[categoryId];
    if (!rule?.homepageSlotId || rule.spotlightTagIds.length === 0) {
      continue;
    }

    const matchedTagId = rule.spotlightTagIds.find((tagId) => input.tagIds.includes(tagId));
    if (!matchedTagId) {
      continue;
    }

    return {
      categoryId,
      homepageSlotId: rule.homepageSlotId,
      spotlightTagId: matchedTagId,
      displayMode: rule.displayMode,
    };
  }

  return null;
}
