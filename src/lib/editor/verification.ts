import type { Block } from '@/lib/types/block';

export interface BlockFeatureSummary {
  blockCount: number;
  maxDepth: number;
  blockTypes: Record<string, number>;
  features: {
    animations: number;
    scrollGradients: number;
    advancedGradients: number;
    customCss: number;
    clipPaths: number;
    topDividers: number;
    bottomDividers: number;
    glassmorphism: number;
    noise: number;
    grain: number;
    backgroundImages: number;
    backgroundVideos: number;
    parallaxBackgrounds: number;
    responsiveTablet: number;
    responsiveMobile: number;
    hiddenBlocks: number;
    lockedBlocks: number;
    positionedBlocks: number;
    overlappingCandidates: number;
  };
  blockIds: string[];
}

export interface HtmlVerificationSummary {
  allBlockWrappersPresent: boolean;
  missingBlockWrappers: string[];
  customCssScopesMissing: string[];
  scrollGradientAttrsMissing: string[];
  animationAttrsMissing: string[];
}

export function summarizeBlockTree(blocks: Block[]): BlockFeatureSummary {
  const blockTypes: Record<string, number> = {};
  const blockIds: string[] = [];
  const features: BlockFeatureSummary['features'] = {
    animations: 0,
    scrollGradients: 0,
    advancedGradients: 0,
    customCss: 0,
    clipPaths: 0,
    topDividers: 0,
    bottomDividers: 0,
    glassmorphism: 0,
    noise: 0,
    grain: 0,
    backgroundImages: 0,
    backgroundVideos: 0,
    parallaxBackgrounds: 0,
    responsiveTablet: 0,
    responsiveMobile: 0,
    hiddenBlocks: 0,
    lockedBlocks: 0,
    positionedBlocks: 0,
    overlappingCandidates: 0,
  };

  let blockCount = 0;
  let maxDepth = 0;

  function walk(nodes: Block[], depth: number) {
    maxDepth = Math.max(maxDepth, depth);
    for (const block of nodes) {
      blockCount += 1;
      blockIds.push(block.id);
      blockTypes[block.type] = (blockTypes[block.type] || 0) + 1;

      if (block.animation) features.animations += 1;
      if (block.style.background?.advancedGradient) {
        features.advancedGradients += 1;
        if (block.style.background.advancedGradient.scrollDriven) {
          features.scrollGradients += 1;
        }
      }
      if (block.style.customCss?.trim()) features.customCss += 1;
      if (block.shape?.type === 'clip-path' && block.shape.value && block.shape.value !== 'none') {
        features.clipPaths += 1;
      }
      if (block.shape?.topDivider) features.topDividers += 1;
      if (block.shape?.bottomDivider) features.bottomDividers += 1;
      if (block.style.effects?.glassmorphism?.enabled) features.glassmorphism += 1;
      if (block.style.effects?.noise?.enabled) features.noise += 1;
      if (block.style.effects?.grain?.enabled) features.grain += 1;
      if (block.style.background?.type === 'image' && block.style.background.value) {
        features.backgroundImages += 1;
        if (block.style.background.parallax) features.parallaxBackgrounds += 1;
      }
      if (block.style.background?.type === 'video' && block.style.background.value) {
        features.backgroundVideos += 1;
      }
      if (block.responsive?.tablet && Object.keys(block.responsive.tablet).length > 0) {
        features.responsiveTablet += 1;
      }
      if (block.responsive?.mobile && Object.keys(block.responsive.mobile).length > 0) {
        features.responsiveMobile += 1;
      }
      if (block.hidden) features.hiddenBlocks += 1;
      if (block.locked) features.lockedBlocks += 1;
      if (block.style.layout?.position && block.style.layout.position !== 'static') {
        features.positionedBlocks += 1;
        if (
          block.style.layout.position === 'absolute' ||
          block.style.layout.position === 'fixed' ||
          typeof block.style.layout.zIndex === 'number'
        ) {
          features.overlappingCandidates += 1;
        }
      }

      if (block.children.length > 0) {
        walk(block.children, depth + 1);
      }
    }
  }

  walk(blocks, 1);

  return {
    blockCount,
    maxDepth,
    blockTypes,
    features,
    blockIds,
  };
}

export function verifyRenderedHtml(blocks: Block[], html: string): HtmlVerificationSummary {
  const summary = summarizeBlockTree(blocks);

  const missingBlockWrappers = summary.blockIds.filter((blockId) => !html.includes(`id="block-${blockId}"`));
  const customCssScopesMissing = collectBlocks(blocks)
    .filter((block) => Boolean(block.style.customCss?.trim()))
    .filter((block) => !html.includes(`#block-${block.id}`))
    .map((block) => block.id);
  const scrollGradientAttrsMissing = collectBlocks(blocks)
    .filter((block) => Boolean(block.style.background?.advancedGradient?.scrollDriven))
    .filter((block) => !html.includes(`id="block-${block.id}"`) || !html.includes('data-scroll-gradient'))
    .map((block) => block.id);
  const animationAttrsMissing = collectBlocks(blocks)
    .filter((block) => Boolean(block.animation))
    .filter((block) => !html.includes(`id="block-${block.id}"`) || !html.includes('data-animate'))
    .map((block) => block.id);

  return {
    allBlockWrappersPresent: missingBlockWrappers.length === 0,
    missingBlockWrappers,
    customCssScopesMissing,
    scrollGradientAttrsMissing,
    animationAttrsMissing,
  };
}

function collectBlocks(blocks: Block[]): Block[] {
  const output: Block[] = [];
  function walk(nodes: Block[]) {
    for (const block of nodes) {
      output.push(block);
      if (block.children.length > 0) walk(block.children);
    }
  }
  walk(blocks);
  return output;
}
