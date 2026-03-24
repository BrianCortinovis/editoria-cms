import { createBlock, type Block, type BlockStyle, type BlockType } from "@/lib/types";
import { getBlockDefinition } from "@/lib/blocks/registry";
import { generateId } from "@/lib/utils/id";
import type { LayoutPresetDef } from "@/lib/config/layout-presets";

export interface PresetBlock {
  type: BlockType;
  label: string;
  props?: Record<string, unknown>;
  styleOverrides?: Record<string, unknown>;
  children?: PresetBlock[];
}

export interface FeaturedLikePreset extends LayoutPresetDef {
  blocks: PresetBlock[];
}

type AnyPreset = LayoutPresetDef | FeaturedLikePreset;

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createConfiguredBlock(
  type: BlockType,
  label: string,
  options?: {
    props?: Record<string, unknown>;
    styleOverrides?: Record<string, unknown>;
    dataSource?: Block["dataSource"];
  }
): Block | null {
  const def = getBlockDefinition(type);
  if (!def) {
    return null;
  }

  const block = createBlock(
    def.type,
    label || def.label,
    { ...def.defaultProps, ...(options?.props || {}) },
    options?.styleOverrides
      ? { ...def.defaultStyle, ...(options.styleOverrides as Partial<BlockStyle>) }
      : def.defaultStyle
  );

  block.id = generateId();

  if (options?.dataSource) {
    block.dataSource = cloneData(options.dataSource);
  } else if (def.defaultDataSource) {
    block.dataSource = cloneData(def.defaultDataSource);
  }

  if (options?.styleOverrides) {
    mergeStyleOverrides(block, options.styleOverrides);
  }

  return block;
}

function decorateAssignedBlock(
  block: Block,
  assignment: {
    role: string;
    rowIndex: number;
    columnIndex?: number;
    layoutPresetId: string;
    layoutPresetName: string;
  }
) {
  block.props = {
    ...block.props,
    layoutAssignment: assignment,
  };

  if (block.dataSource) {
    block.dataSource = {
      ...block.dataSource,
      params: {
        ...(typeof block.dataSource.params === "object" && block.dataSource.params ? block.dataSource.params : {}),
        layoutRole: assignment.role,
      },
    };
  }

  return block;
}

function mergeStyleOverrides(block: Block, styleOverrides: Record<string, unknown>) {
  const background = styleOverrides.background as Partial<BlockStyle["background"]> | undefined;
  const typography = styleOverrides.typography as Partial<BlockStyle["typography"]> | undefined;
  const border = styleOverrides.border as Partial<BlockStyle["border"]> | undefined;
  const layout = styleOverrides.layout as Partial<BlockStyle["layout"]> | undefined;

  if (background) {
    block.style.background = { ...block.style.background, ...background };
  }
  if (typography) {
    block.style.typography = { ...block.style.typography, ...typography };
  }
  if (border) {
    block.style.border = { ...block.style.border, ...border };
  }
  if (layout) {
    block.style.layout = {
      ...block.style.layout,
      ...layout,
      padding: layout.padding
        ? { ...block.style.layout.padding, ...layout.padding }
        : block.style.layout.padding,
      margin: layout.margin
        ? { ...block.style.layout.margin, ...layout.margin }
        : block.style.layout.margin,
    };
  }
}

function buildPresetBlockTree(presetBlock: PresetBlock): Block | null {
  const def = getBlockDefinition(presetBlock.type);
  if (!def) {
    return null;
  }

  const block = createBlock(
    def.type,
    presetBlock.label || def.label,
    { ...def.defaultProps, ...(presetBlock.props || {}) },
    presetBlock.styleOverrides
      ? { ...def.defaultStyle, ...(presetBlock.styleOverrides as Partial<BlockStyle>) }
      : def.defaultStyle
  );

  block.id = generateId();

  if (def.defaultDataSource) {
    block.dataSource = cloneData(def.defaultDataSource);
  }

  if (presetBlock.styleOverrides) {
    mergeStyleOverrides(block, presetBlock.styleOverrides);
  }

  if (Array.isArray(presetBlock.children) && presetBlock.children.length > 0) {
    block.children = presetBlock.children
      .map((child) => buildPresetBlockTree(child))
      .filter((child): child is Block => Boolean(child));
  }

  return block;
}

function createWireframeSection(label: string, minHeight: string, width = "100%"): Block {
  const section = createBlock("section", label, { tag: "section", fullWidth: true });
  section.id = generateId();
  section.style.layout.width = width;
  section.style.layout.maxWidth = "100%";
  section.style.layout.minHeight = minHeight;
  section.style.layout.padding = { top: "0", right: "0", bottom: "0", left: "0" };
  section.style.background = {
    type: "color",
    value: "rgba(59, 130, 246, 0.08)",
    overlay: "",
    parallax: false,
    size: "cover",
    position: "center",
    repeat: "no-repeat",
  };
  section.style.border = {
    width: "2px",
    style: "dashed",
    color: "rgba(59, 130, 246, 0.85)",
    radius: "0px",
  };
  section.style.typography = {
    ...section.style.typography,
    color: "#1d4ed8",
  };
  section.style.customCss = "position: relative;";
  return section;
}

function numericWidth(value: string) {
  const parsed = Number.parseFloat(value.replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSingleColumnLabel(rowIndex: number, totalRows: number, height: number) {
  if (rowIndex === 0) return "Header";
  if (rowIndex === totalRows - 1) return "Footer";
  if (height >= 45) return "Hero";
  if (height <= 8) return `Separatore ${rowIndex}`;
  if (rowIndex === 1) return "Sezione Principale";
  return `Sezione ${rowIndex + 1}`;
}

function getColumnLabels(cols: string[], rowIndex: number) {
  if (cols.length === 2) {
    const [left, right] = cols.map(numericWidth);
    if (rowIndex === 1 && left >= 60) return ["Contenuto Principale", "Sidebar"];
    if (rowIndex === 1 && right >= 60) return ["Sidebar", "Contenuto Principale"];
    if (left <= 28 && right >= 60) return ["Sidebar", "Contenuto"];
    if (right <= 28 && left >= 60) return ["Contenuto", "Sidebar"];
    return ["Colonna Sinistra", "Colonna Destra"];
  }

  if (cols.length === 3) {
    const [left, center, right] = cols.map(numericWidth);
    if (center > left && center > right) return ["Colonna SX", "Contenuto Centrale", "Colonna DX"];
    if (left > center && left > right) return ["Hero / Focus", "Supporto", "Supporto"];
    if (right > center && right > left) return ["Supporto", "Supporto", "Hero / Focus"];
    return ["Colonna 1", "Colonna 2", "Colonna 3"];
  }

  if (cols.length === 4) {
    return ["Blocco 1", "Blocco 2", "Blocco 3", "Blocco 4"];
  }

  return cols.map((_, index) => `Blocco ${index + 1}`);
}

function buildGridPresetBlocks(preset: LayoutPresetDef): Block[] {
  const createAssignedLeaf = (
    label: string,
    width: string,
    rowIndex: number,
    columnIndex: number | null,
    totalRows: number,
    height: number,
    totalCols: number
  ) => {
    const normalizedLabel = label.toLowerCase();
    const widthValue = numericWidth(width);
    const sharedStyle = {
      layout: {
        width,
        maxWidth: "100%",
        minHeight: `${height * 5}px`,
      },
    };

    if (rowIndex === 0 || /header|nav/i.test(normalizedLabel)) {
      return decorateAssignedBlock(
        createConfiguredBlock("navigation", label, {
          props: {
            mode: "global",
            menuKey: "primary",
            sticky: true,
          },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "site-navigation", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (rowIndex === totalRows - 1 || /footer/i.test(normalizedLabel)) {
      return decorateAssignedBlock(
        createConfiguredBlock("footer", label, {
          props: {
            mode: "global",
          },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "site-footer", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (height <= 8 || /ticker|breaking|separatore/i.test(normalizedLabel)) {
      const type: BlockType = /breaking|ticker/i.test(normalizedLabel) || rowIndex <= 1 ? "breaking-ticker" : "divider";
      return decorateAssignedBlock(
        createConfiguredBlock(type, label, {
          props: type === "divider"
            ? { shape: "diagonal", height: 42, color: "#e5e7eb" }
            : { label: "ULTIMA ORA" },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: type === "divider" ? "section-divider" : "breaking-ticker", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (height >= 45 || /hero|focus|apertura/i.test(normalizedLabel)) {
      const heroType: BlockType = /articolo|news|focus|apertura/i.test(normalizedLabel) ? "article-hero" : "hero";
      return decorateAssignedBlock(
        createConfiguredBlock(heroType, label, {
          props: heroType === "article-hero"
            ? {
                useFeatured: true,
                showExcerpt: true,
                showAuthor: true,
                showDate: true,
                height: `${Math.max(height * 5, 360)}px`,
              }
            : {
                title: label,
                subtitle: "Sezione principale della pagina",
                ctaText: "Leggi ora",
              },
          styleOverrides: {
            ...sharedStyle,
            layout: {
              ...sharedStyle.layout,
              minHeight: `${Math.max(height * 5, 360)}px`,
            },
          },
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "hero", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (/video|tg/i.test(normalizedLabel)) {
      return decorateAssignedBlock(
        createConfiguredBlock("video", label, {
          props: {
            source: "youtube",
            caption: label,
            overlay: {
              enabled: true,
              title: label,
              description: "Spazio video assegnato dal layout",
              playButtonStyle: "circle",
              playButtonSize: "large",
              color: "rgba(0,0,0,0.35)",
              position: "center",
            },
          },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "video-slot", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (/sidebar/i.test(normalizedLabel) || widthValue <= 28) {
      return decorateAssignedBlock(
        createConfiguredBlock("article-grid", label, {
          props: {
            title: label,
            columns: 1,
            limit: 5,
            showExcerpt: false,
            showAuthor: false,
          },
          dataSource: {
            endpoint: "articles",
            params: { limit: "5", status: "published", layoutRole: "sidebar" },
          },
          styleOverrides: {
            ...sharedStyle,
            layout: {
              ...sharedStyle.layout,
              padding: { top: "16px", right: "0", bottom: "16px", left: "0" },
            },
          },
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "sidebar", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (totalCols >= 3 && columnIndex === 1) {
      return decorateAssignedBlock(
        createConfiguredBlock("article-hero", label, {
          props: {
            useFeatured: true,
            showExcerpt: true,
            showDate: true,
            showAuthor: true,
            height: `${Math.max(height * 5, 320)}px`,
          },
          styleOverrides: {
            ...sharedStyle,
            layout: {
              ...sharedStyle.layout,
              minHeight: `${Math.max(height * 5, 320)}px`,
            },
          },
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "main-story", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (/banner|adv|pubblic/i.test(normalizedLabel)) {
      return decorateAssignedBlock(
        createConfiguredBlock("banner-zone", label, {
          props: {
            title: label,
            slotKey: `layout-${preset.id}-banner-${rowIndex}-${columnIndex ?? 0}`,
          },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "banner-slot", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    if (/newsletter/i.test(normalizedLabel)) {
      return decorateAssignedBlock(
        createConfiguredBlock("newsletter-signup", label, {
          props: {
            mode: "global",
            title: label,
          },
          styleOverrides: sharedStyle,
        }) || createWireframeSection(label, `${height * 5}px`, width),
        { role: "newsletter-slot", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
      );
    }

    return decorateAssignedBlock(
      createConfiguredBlock("article-grid", label, {
        props: {
          title: label,
          columns: widthValue >= 70 ? 3 : widthValue >= 45 ? 2 : 1,
          limit: widthValue >= 70 ? 6 : 4,
          showExcerpt: widthValue >= 45,
          showAuthor: widthValue >= 45,
          showDate: true,
        },
        dataSource: {
          endpoint: "articles",
          params: {
            limit: widthValue >= 70 ? "6" : "4",
            status: "published",
          },
        },
        styleOverrides: {
          ...sharedStyle,
          layout: {
            ...sharedStyle.layout,
            padding: { top: "16px", right: "0", bottom: "16px", left: "0" },
          },
        },
      }) || createWireframeSection(label, `${height * 5}px`, width),
      { role: "content-grid", rowIndex, columnIndex: columnIndex ?? undefined, layoutPresetId: preset.id, layoutPresetName: preset.name }
    );
  };

  return preset.rows.map((row, rowIndex) => {
    const [height, ...cols] = row;
    const heightPx = `${(height as number) * 5}px`;

    if (cols.length === 1) {
      return createAssignedLeaf(
        getSingleColumnLabel(rowIndex, preset.rows.length, height as number),
        cols[0] as string,
        rowIndex,
        null,
        preset.rows.length,
        height as number,
        1
      );
    }

    const columns = createConfiguredBlock("columns", `Riga ${rowIndex + 1}`, {
      props: {
        columnCount: cols.length,
        columnWidths: cols,
        gap: "16px",
        stackOnMobile: true,
      },
    });
    if (!columns) {
      return createWireframeSection(`Riga ${rowIndex + 1}`, heightPx);
    }
    columns.id = generateId();
    columns.style.layout.width = "100%";
    columns.style.layout.maxWidth = "100%";
    columns.style.layout.minHeight = heightPx;
    columns.style.layout.padding = { top: "0", right: "0", bottom: "0", left: "0" };
    columns.props = {
      ...columns.props,
      layoutAssignment: {
        role: "row-container",
        rowIndex,
        layoutPresetId: preset.id,
        layoutPresetName: preset.name,
      },
    };

    const labels = getColumnLabels(cols as string[], rowIndex);
    columns.children = cols.map((width, columnIndex) =>
      createAssignedLeaf(
        labels[columnIndex] || `Blocco ${columnIndex + 1}`,
        width as string,
        rowIndex,
        columnIndex,
        preset.rows.length,
        height as number,
        cols.length
      )
    );

    return columns;
  });
}

function isFeaturedPreset(preset: AnyPreset): preset is FeaturedLikePreset {
  return "blocks" in preset && Array.isArray((preset as FeaturedLikePreset).blocks);
}

export function buildLayoutPresetBlocks(preset: AnyPreset): Block[] {
  if (isFeaturedPreset(preset)) {
    return preset.blocks
      .map((block) => buildPresetBlockTree(block))
      .filter((block): block is Block => Boolean(block));
  }

  return buildGridPresetBlocks(preset);
}
