#!/usr/bin/env node
/**
 * 小红书「论坛体小说」高清图片生成器 (手绘草稿手账风 · 多色系/随机配色 · 移动端大字版)
 *
 * 视觉风格（去 AI 感 · 纯正手绘草稿本风）：
 *   1. 彻底摒弃 AI 模板常见的光泽渐变、模糊阴影、胶囊按钮与系统 Emoji。
 *   2. 采用 SVG 手绘钢笔抖动滤镜 (feTurbulence + feDisplacementMap) 渲染卡片线框、胶带与印章，
 *      每一根线条都有真实的钢笔手绘不规则感，而正文文字保持 100% 锐利清晰。
 *   3. 方格草稿纸底纹 + 马克笔平涂错位硬阴影 + 手绘和纸胶带 + 荧光笔半涂抹台词高亮 + 简笔画涂鸦头像。
 *   4. 默认采用「暖杏甜橘 (warm-orange)」色系，同时支持 7 套预设色系、--random 随机色系与 --color 自定义色系。
 *
 * 用法示例：
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md"
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --theme=mist-blue
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --random
 *   node "./工具/生成小红书论坛体图片.js" "./小说/咬痕与匿名帖/咬痕与匿名帖.md" --color=#D96B43
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadPlaywright() {
  const candidates = [
    'playwright',
    '/Users/bytedance/.nvm/versions/node/v24.14.1/lib/node_modules/@playwright/cli/node_modules/playwright',
  ];
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    candidates.push(path.join(globalRoot, 'playwright'));
    candidates.push(path.join(globalRoot, '@playwright/cli/node_modules/playwright'));
  } catch (_) {}

  for (const modPath of candidates) {
    try {
      return require(modPath);
    } catch (_) {}
  }
  throw new Error('未找到 playwright 模块，请检查 Node 环境。');
}

function hexToHue(hex) {
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
}

/**
 * 根据色相角 (Hue 0~360) 生成全套「手绘草稿水彩/马克笔」配色方案
 */
function createSketchThemeFromHue(hue, customMeta = {}) {
  const h = ((Math.round(hue) % 360) + 360) % 360;

  return {
    id: customMeta.id || `hue-${h}`,
    label: customMeta.label || `手绘自定义色系 (Hue=${h}°)`,
    // 草稿纸底色与方格线颜色
    paperBg: customMeta.paperBg || `hsl(${h}, 38%, 96.2%)`,
    gridLine: customMeta.gridLine || `hsla(${h}, 28%, 76%, 0.38)`,
    marginLine: customMeta.marginLine || `hsla(${h}, 55%, 68%, 0.42)`,
    // 钢笔墨水主色（深暖褐/炭黑，不用死黑）
    inkColor: customMeta.inkColor || '#362E29',
    inkMuted: customMeta.inkMuted || '#7A6E65',
    // 马克笔主色与高光色
    markerSolid: customMeta.markerSolid || `hsl(${h}, 76%, 62%)`,
    markerDeep: customMeta.markerDeep || `hsl(${h}, 72%, 38%)`,
    markerSoft: customMeta.markerSoft || `hsl(${h}, 82%, 88%)`,
    highlighter: customMeta.highlighter || `hsla(${h}, 90%, 74%, 0.52)`,
    // 卡片填充与硬错位阴影
    opCardFill: customMeta.opCardFill || `hsl(${h}, 65%, 97.8%)`,
    opShadow: customMeta.opShadow || `hsl(${h}, 62%, 80%)`,
    anonCardFill: '#FFFEFC',
    anonShadow: customMeta.anonShadow || `hsl(${h}, 26%, 85%)`,
    // 和纸胶带颜色
    tapeBg: customMeta.tapeBg || `hsla(${h}, 78%, 78%, 0.62)`,
    tapeStripe: customMeta.tapeStripe || `hsla(${h}, 70%, 58%, 0.25)`,
    // 男主深色炭笔速写卡
    darkCardFill: customMeta.darkCardFill || '#282422',
    darkCardShadow: customMeta.darkCardShadow || `hsl(${h}, 45%, 72%)`,
    darkAccent: customMeta.darkAccent || '#F6AD55',
  };
}

/**
 * 7 套内置手绘水彩/马克笔主题色系（默认 warm-orange 暖杏甜橘）
 */
const PRESET_THEMES = {
  'warm-orange': createSketchThemeFromHue(22, {
    id: 'warm-orange',
    label: '暖杏甜橘（默认手账暖调）',
    paperBg: '#FAF4EB',
    gridLine: 'rgba(210, 190, 168, 0.38)',
    marginLine: 'rgba(235, 145, 105, 0.35)',
    inkColor: '#362D26',
    inkMuted: '#7D6F63',
    markerSolid: '#F27D42',
    markerDeep: '#B84A18',
    markerSoft: '#FFE3CE',
    highlighter: 'rgba(255, 182, 130, 0.52)',
    opCardFill: '#FFFDF9',
    opShadow: '#F2C09E',
    anonShadow: '#E5D8C7',
    tapeBg: 'rgba(255, 190, 145, 0.58)',
    tapeStripe: 'rgba(230, 115, 55, 0.22)',
    darkCardFill: '#2A2522',
    darkCardShadow: '#D8B89E',
    darkAccent: '#F8B462',
  }),
  'mist-blue': createSketchThemeFromHue(206, {
    id: 'mist-blue',
    label: '雾凇冰蓝（冷白钢笔速写）',
  }),
  'rose-quartz': createSketchThemeFromHue(345, {
    id: 'rose-quartz',
    label: '微醺烟粉（干枯玫瑰手账）',
  }),
  'matcha-sage': createSketchThemeFromHue(145, {
    id: 'matcha-sage',
    label: '竹影青提（森系水彩草稿）',
  }),
  'taro-purple': createSketchThemeFromHue(262, {
    id: 'taro-purple',
    label: '暮山香芋（灰紫钢笔手札）',
  }),
  'caramel-latte': createSketchThemeFromHue(32, {
    id: 'caramel-latte',
    label: '焦糖拿铁（复古牛皮纸风）',
    paperBg: '#F6EFE4',
  }),
  'berry-wine': createSketchThemeFromHue(356, {
    id: 'berry-wine',
    label: '浆果红酒（复古红黑手账）',
  }),
};

function resolveTheme(options = {}, mdContent = '') {
  if (options.color) {
    const hue = hexToHue(options.color);
    return createSketchThemeFromHue(hue, {
      id: `custom-${options.color}`,
      label: `自定义手绘色号 (${options.color} -> Hue=${hue}°)`,
    });
  }
  if (options.hue !== null && options.hue !== undefined && !Number.isNaN(options.hue)) {
    return createSketchThemeFromHue(options.hue, {
      id: `hue-${options.hue}`,
      label: `自定义手绘色相 (Hue=${options.hue}°)`,
    });
  }
  if (options.random || options.theme === 'random') {
    const randomHue = Math.floor(Math.random() * 360);
    return createSketchThemeFromHue(randomHue, {
      id: `random-hue-${randomHue}`,
      label: `随机生成手绘色系 (可通过 --hue=${randomHue} 复现)`,
    });
  }
  if (options.theme && PRESET_THEMES[options.theme]) {
    return PRESET_THEMES[options.theme];
  }
  const mdThemeMatch = mdContent.match(/<!--\s*theme:\s*([a-zA-Z0-9-#]+)\s*-->/);
  if (mdThemeMatch) {
    const val = mdThemeMatch[1].trim();
    if (PRESET_THEMES[val]) return PRESET_THEMES[val];
    if (val.startsWith('#')) return createSketchThemeFromHue(hexToHue(val));
  }
  // 默认使用暖杏甜橘
  return PRESET_THEMES['warm-orange'];
}

function parseForumMarkdown(mdContent) {
  let boardName = '内部论坛 > 树洞互助区';
  let title = '';
  const blocks = mdContent.replace(/\r\n/g, '\n').split(/\n---\n/);

  const headerBlock = blocks[0] || '';
  const headerLines = headerBlock.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of headerLines) {
    const clean = line.replace(/^\*\*|\*\*$/g, '').trim();
    if (clean.startsWith('【') && clean.endsWith('】') && !clean.includes('0L')) {
      boardName = clean.slice(1, -1).trim();
    } else if (clean.startsWith('标题：') || clean.startsWith('标题:')) {
      title = clean.replace(/^标题[：:]\s*/, '').trim();
    }
  }

  const floors = [];
  const systemNotices = [];

  for (const rawBlock of blocks) {
    const blockLines = rawBlock.split('\n');
    let currentFloor = null;

    for (let i = 0; i < blockLines.length; i++) {
      const rawLine = blockLines[i];
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('<!--')) continue;

      const sysMatch = trimmed.match(/^>\s*\*\*【(.*?)】\*\*$/);
      if (sysMatch && !currentFloor) {
        systemNotices.push(sysMatch[1].trim());
        continue;
      }

      const floorMatch = trimmed.match(/^\*\*【(\d+L(?:\s*（主楼）|\s*\(主楼\))?)\s+(.+?)】\*\*(?:[｜|]\s*(.+))?$/);
      if (floorMatch) {
        const floorNum = floorMatch[1].replace(/（主楼）|\(主楼\)/g, '').trim();
        let rawAuthor = floorMatch[2].trim();
        const timeText = floorMatch[3] ? floorMatch[3].trim() : '';

        let isOP = false;
        if (rawAuthor.includes('（楼主）') || rawAuthor.includes('(楼主)')) {
          isOP = true;
          rawAuthor = rawAuthor.replace(/（楼主）|\(楼主\)/g, '').trim();
        }

        const isAnon = rawAuthor === '匿名用户' || rawAuthor.startsWith('匿名');
        const isSpecialUser = !isOP && !isAnon;

        currentFloor = {
          floorNum,
          numInt: parseInt(floorNum, 10) || 0,
          author: rawAuthor,
          timeText,
          isOP,
          isAnon,
          isSpecialUser,
          quotes: [],
          paragraphs: [],
        };
        floors.push(currentFloor);
        continue;
      }

      if (!currentFloor) continue;

      if (sysMatch) {
        systemNotices.push(sysMatch[1].trim());
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '').trim();
        if (quoteText) {
          currentFloor.quotes.push(quoteText);
        }
        continue;
      }

      currentFloor.paragraphs.push(trimmed);
    }
  }

  for (const f of floors) {
    if (!f.isOP && f.paragraphs.length > 1) {
      const merged = [];
      for (const p of f.paragraphs) {
        if (merged.length > 0 && merged[merged.length - 1].length + p.length <= 46) {
          merged[merged.length - 1] += ' ' + p;
        } else {
          merged.push(p);
        }
      }
      f.paragraphs = merged;
    }
  }

  return {
    boardName,
    title: title || '匿名树洞求助帖',
    floors,
    systemNotices,
  };
}

function formatInlineMarkdown(text, isSpecialCard = false) {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`(.+?)`/g, '<span class="inline-code">$1</span>');
  escaped = escaped.replace(/@([^\s，。！？、：；]+)/g, '<span class="mention">@$1</span>');

  if (!isSpecialCard) {
    escaped = escaped.replace(/「([^」]+)」/g, '<span class="marker-highlight">「$1」</span>');
  }

  return escaped;
}

/**
 * 纯手绘钢笔简笔画涂鸦头像（不规则线条 + 错位水彩点染，彻底去 AI 感）
 */
function getHandDrawnAvatarSVG(floor, theme) {
  const ink = theme.inkColor;
  if (floor.isOP) {
    // 楼主：手绘简笔画小柑橘 + 叶子 + 三道脸红斜线
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="21" r="10" fill="${theme.markerSoft}"/>
        <path d="M18 11C11.5 11.2 8.2 15.8 8.5 21.5C8.8 27.2 13.2 30.5 19 30.2C24.8 29.9 28.5 25.8 28.2 20.2C27.9 14.6 23.8 10.8 18 11Z" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M18 11C18.2 8.2 21.5 6.2 24.2 7.5C23.5 9.8 20.5 11.2 18 11Z" fill="#88C070" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="14.5" cy="19.8" r="1.3" fill="${ink}"/>
        <circle cx="21.8" cy="19.5" r="1.3" fill="${ink}"/>
        <path d="M16.8 22.2C17.6 23.1 19.1 23 19.8 22" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M11.5 22L12.5 23.2M13 22L14 23.2M23 21.5L24 22.8" stroke="${theme.markerSolid}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (floor.isSpecialUser) {
    // 男主小号：手绘速写小黑豹（左耳带小缺口）+ 金色眼神
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 28L9.5 10.5L14.5 15.2H21.5L26.5 10.2L28 28Z" fill="#1F1B18" stroke="#F4EFE6" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M9.2 12.8L11.8 13.5" stroke="#2A2522" stroke-width="2.2"/>
        <circle cx="14.8" cy="20.5" r="1.7" fill="${theme.darkAccent}"/>
        <circle cx="21.2" cy="20.5" r="1.7" fill="${theme.darkAccent}"/>
        <path d="M13.5 18.2L16.2 19.2M22.5 18.2L19.8 19.2" stroke="#F4EFE6" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    `;
  }

  // 吃瓜群众：4 种简笔画火柴人/涂鸦小表情轮换
  const styleIdx = floor.numInt % 4;
  const spotColors = ['#FFE4C4', '#DCEEF2', '#E8E2F4', '#E2F0CB'];
  const spot = spotColors[styleIdx];

  if (styleIdx === 0) {
    // 简笔画小猫耳涂鸦
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19.5" cy="20.5" r="9.5" fill="${spot}"/>
        <path d="M10 17L11.5 10.5L15.8 14.2C17.2 13.8 19 13.8 20.5 14.2L24.8 10.2L26.2 17C27.5 20.5 26.2 26.8 21.5 28.2C16.8 29.5 12.2 28.2 10.5 24.8C9.2 22.2 9.5 19 10 17Z" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="15" cy="20.5" r="1.2" fill="${ink}"/>
        <circle cx="21" cy="20.5" r="1.2" fill="${ink}"/>
        <path d="M17.2 22.5L18.2 23.3L19.2 22.5" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;
  } else if (styleIdx === 1) {
    // 简笔画圆框眼镜吃瓜小人
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="20" r="9.5" fill="${spot}"/>
        <path d="M18 10.5C12.5 10.8 9.2 15.2 9.5 20.8C9.8 26.2 14.2 29.2 19.2 28.8C24.5 28.4 27.5 24.2 27.2 19.2C26.9 14.2 23.2 10.2 18 10.5Z" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="14.5" cy="19.5" r="2.8" stroke="${ink}" stroke-width="1.4"/>
        <circle cx="21.5" cy="19.5" r="2.8" stroke="${ink}" stroke-width="1.4"/>
        <path d="M17.3 19.5H18.7" stroke="${ink}" stroke-width="1.4"/>
        <circle cx="18" cy="24.2" r="1.3" stroke="${ink}" stroke-width="1.3"/>
      </svg>`;
  } else if (styleIdx === 2) {
    // 简笔画垂耳小兔涂鸦
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19" cy="21" r="9" fill="${spot}"/>
        <path d="M14 13.5C11.2 13.8 8.5 18.5 9.5 22.5C10.2 25 11.8 23.5 12.2 21M22 13.5C24.8 13.8 27.5 18.5 26.5 22.5C25.8 25 24.2 23.5 23.8 21" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="18" cy="20.5" r="7.5" fill="#FFFEFC" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="15.5" cy="19.8" r="1.2" fill="${ink}"/>
        <circle cx="20.5" cy="19.8" r="1.2" fill="${ink}"/>
        <path d="M17 22.2C17.6 22.8 18.4 22.8 19 22.2" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;
  } else {
    // 简笔画呆毛吃瓜小人
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17.5" cy="20.5" r="9.5" fill="${spot}"/>
        <path d="M18 11.5C16.5 8.2 19.5 6.5 21 8.5" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M18 11.5C12.8 11.8 9.5 15.8 9.8 21C10.1 26.2 14.2 29 19 28.8C23.8 28.6 27.2 24.8 26.8 19.8C26.4 14.8 22.8 11.2 18 11.5Z" stroke="${ink}" stroke-width="1.6"/>
        <path d="M14 19.2H16M20 19.2H22" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16.2 23.2C17.2 24 19.2 24 20.2 23" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
      </svg>`;
  }
}

function renderFloorSliceHTML(floor, slice, theme) {
  let roleClass = 'role-anon';
  let badgeHTML = '';

  if (floor.isOP) {
    roleClass = 'role-op';
    badgeHTML = '<span class="sketch-stamp stamp-op">楼主</span>';
  } else if (floor.isSpecialUser) {
    roleClass = 'role-special';
    badgeHTML = '<span class="sketch-stamp stamp-special">刚注册</span>';
  } else {
    // 匿名用户后面绝不显示任何身份/部门 tag
    roleClass = 'role-anon';
    badgeHTML = '';
  }

  const avatarSVG = getHandDrawnAvatarSVG(floor, theme);

  const quotesHTML = (slice.quotes || [])
    .map((q) => `<div class="floor-quote">↳ ${formatInlineMarkdown(q, floor.isSpecialUser)}</div>`)
    .join('');

  const paragraphsHTML = (slice.paragraphs || [])
    .map((p, pIdx) => `<p class="floor-p" data-p-idx="${pIdx}">${formatInlineMarkdown(p, floor.isSpecialUser)}</p>`)
    .join('');

  const baseLabel = floor.floorNum === '0L' ? '#0L 主楼' : `#${floor.floorNum}`;
  const floorLabel = slice.isCont ? `${baseLabel} (续)` : baseLabel;

  return `
    <div class="floor-item ${roleClass}" data-slice-id="${slice.sliceId || ''}">
      <div class="sketch-border-layer"></div>
      <div class="floor-content-layer">
        <div class="floor-header">
          <div class="floor-user">
            <div class="avatar">${avatarSVG}</div>
            <span class="author-name">${formatInlineMarkdown(floor.author, floor.isSpecialUser)}</span>
            ${badgeHTML}
          </div>
          <div class="floor-meta">
            <span class="floor-num">${floorLabel}</span>
          </div>
        </div>
        <div class="floor-body">
          ${quotesHTML}
          ${paragraphsHTML}
        </div>
      </div>
    </div>
  `;
}

/**
 * 全局公用 SVG 滤镜（让边框、胶带、印章产生真实的钢笔手绘微抖动，而文字不受影响）
 */
function buildGlobalSketchSVGDefs() {
  return `
    <svg width="0" height="0" style="position:absolute; pointer-events:none;">
      <defs>
        <filter id="sketch-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    </svg>
  `;
}

function buildPageCSS(theme, fontSize = 15.6, lineHeight = 1.48, cardGap = 7) {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #262320;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Hiragino Sans GB", sans-serif;
      color: ${theme.inkColor};
    }
    /* 375x500 手机原生视口 (3x 导出为 1125x1500 高清图)：方格手账草稿本底纸 */
    .xhs-card {
      width: 375px;
      height: 500px;
      background-color: ${theme.paperBg};
      background-image:
        linear-gradient(${theme.gridLine} 1px, transparent 1px),
        linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px);
      background-size: 18px 18px;
      background-position: -1px -1px;
      padding: 8px 11px 7px 11px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    /* 顶部手写笔记本眉栏（无胶囊背景，纯钢笔字+手绘波浪底线） */
    .notebook-header {
      height: 22px;
      margin-bottom: 5px;
      padding: 0 2px 3px 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px dashed ${theme.inkMuted};
      flex-shrink: 0;
    }
    .nb-left {
      font-size: 11px;
      font-weight: 700;
      color: ${theme.inkMuted};
      letter-spacing: 0.3px;
    }
    .nb-right {
      font-family: "Bradley Hand", "Chalkboard SE", "Comic Sans MS", "PingFang SC", monospace;
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkColor};
    }
    /* 首页手绘便签大标题卡（带顶部手绘和纸胶带） */
    .hero-memo-card {
      position: relative;
      margin-top: 3px;
      margin-bottom: 8px;
      padding: 12px 13px 10px 13px;
      flex-shrink: 0;
    }
    .hero-sketch-box {
      position: absolute;
      inset: 0;
      background: #FFFDF9;
      border: 1.8px solid ${theme.inkColor};
      border-radius: 14px 4px 12px 5px / 5px 12px 4px 14px;
      box-shadow: 3px 3px 0px ${theme.opShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    /* 顶部半透明斜纹手绘和纸胶带 */
    .washi-tape {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(-1.8deg);
      width: 76px;
      height: 14px;
      background-color: ${theme.tapeBg};
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        ${theme.tapeStripe} 4px,
        ${theme.tapeStripe} 8px
      );
      border-left: 1.5px dotted rgba(255,255,255,0.7);
      border-right: 1.5px dotted rgba(255,255,255,0.7);
      filter: url(#sketch-wobble);
      z-index: 2;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .sketch-topic-tag {
      display: inline-block;
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      border: 1.4px solid ${theme.inkColor};
      border-radius: 8px 3px 7px 3px / 3px 7px 3px 8px;
      font-size: 11px;
      font-weight: 800;
      padding: 0.5px 6px;
      margin-right: 5px;
      vertical-align: 1px;
      transform: rotate(-1.5deg);
    }
    .title-text {
      font-size: ${Math.round((fontSize + 0.6) * 10) / 10}px;
      font-weight: 800;
      line-height: 1.38;
      color: ${theme.inkColor};
    }
    /* 楼层草稿框列表容器 */
    .floors-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: ${cardGap}px;
      overflow: hidden;
      padding-right: 3px;
      padding-bottom: 3px;
    }
    /* 单个楼层容器：将手绘抖动线框层与锐利文字层分离 */
    .floor-item {
      position: relative;
      padding: 8px 12px 8.5px 12px;
    }
    .sketch-border-layer {
      position: absolute;
      inset: 0;
      background: ${theme.anonCardFill};
      border: 1.5px solid ${theme.inkColor};
      border-radius: 10px 18px 12px 16px / 16px 10px 18px 12px;
      box-shadow: 2.5px 2.5px 0px ${theme.anonShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .floor-item.role-op .sketch-border-layer {
      background: ${theme.opCardFill};
      border: 1.7px solid ${theme.inkColor};
      border-radius: 16px 8px 15px 9px / 9px 16px 8px 15px;
      box-shadow: 3px 3px 0px ${theme.opShadow};
    }
    .floor-item.role-special .sketch-border-layer {
      background: ${theme.darkCardFill};
      border: 1.8px solid ${theme.inkColor};
      border-radius: 8px 14px 9px 15px / 14px 9px 15px 8px;
      box-shadow: 3px 3px 0px ${theme.darkCardShadow};
    }
    .floor-content-layer {
      position: relative;
      z-index: 1;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3.5px;
    }
    .floor-user {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .avatar {
      width: 23px;
      height: 23px;
      flex-shrink: 0;
    }
    .avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .author-name {
      font-size: 13px;
      font-weight: 700;
      color: #5C5046;
    }
    .role-op .author-name {
      color: ${theme.markerDeep};
      font-weight: 800;
    }
    .role-special .author-name {
      color: #F7F3EB;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    /* 手绘小印章标签（无 Emoji） */
    .sketch-stamp {
      font-size: 9.5px;
      font-weight: 800;
      padding: 0.5px 5px;
      border: 1.2px solid ${theme.inkColor};
      border-radius: 4px 7px 3px 6px / 6px 3px 7px 4px;
      line-height: 1.25;
      display: inline-block;
    }
    .stamp-op {
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      transform: rotate(-1.5deg);
    }
    .stamp-special {
      background: ${theme.darkAccent};
      color: #1F1B18;
      border-color: #F7F3EB;
      transform: rotate(1deg);
    }
    .stamp-note {
      background: #F3EDE2;
      color: #5C5046;
      border-style: dashed;
    }
    .floor-num {
      font-family: "Bradley Hand", "Chalkboard SE", "Comic Sans MS", monospace;
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkMuted};
    }
    .role-op .floor-num {
      color: ${theme.markerDeep};
    }
    .role-special .floor-num {
      color: ${theme.darkAccent};
    }
    .floor-body {
      padding-left: 0;
    }
    .floor-quote {
      padding: 1.5px 7px;
      margin-bottom: 3.5px;
      font-size: 12.5px;
      font-weight: 600;
      color: ${theme.inkMuted};
      border-left: 2px dashed ${theme.inkMuted};
    }
    .floor-p {
      font-size: ${fontSize}px;
      font-weight: 450;
      -webkit-text-stroke: 0.12px currentColor;
      line-height: ${lineHeight};
      color: ${theme.inkColor};
      margin-bottom: 3.5px;
      letter-spacing: 0.12px;
      word-break: break-word;
    }
    .floor-p:last-child {
      margin-bottom: 0;
    }
    .role-special .floor-p {
      color: #F7F3EB;
      font-weight: 600;
      -webkit-text-stroke: 0.15px currentColor;
      letter-spacing: 0.25px;
    }
    /* 手绘马克笔半高涂抹高亮（真实手账感） */
    .marker-highlight {
      background: linear-gradient(
        104deg,
        transparent 0.5%,
        ${theme.highlighter} 2%,
        ${theme.highlighter} 97%,
        transparent 99%
      );
      background-position: 0 58%;
      background-size: 100% 52%;
      background-repeat: no-repeat;
      font-weight: 600;
      padding: 0 1px;
    }
    .inline-code {
      font-family: "Bradley Hand", "Chalkboard SE", "SF Mono", monospace;
      font-size: ${Math.round((fontSize - 0.8) * 10) / 10}px;
      background: ${theme.markerSoft};
      color: ${theme.inkColor};
      border-bottom: 1.5px solid ${theme.markerSolid};
      padding: 0 4px;
      font-weight: 700;
    }
    .mention {
      color: ${theme.markerDeep};
      font-weight: 700;
      text-decoration: underline wavy ${theme.markerSolid} 1px;
      text-underline-offset: 2px;
    }
    /* 手绘封帖虚线框 */
    .system-notice {
      position: relative;
      padding: 8px 12px;
      text-align: center;
      font-size: 12.5px;
      font-weight: 700;
      color: ${theme.inkColor};
      background: ${theme.markerSoft};
      border: 1.6px dashed ${theme.inkColor};
      border-radius: 8px 12px 9px 11px;
    }
    /* 尾页手绘印章归档便签 */
    .ending-archive-card {
      margin-top: auto;
      position: relative;
      padding: 10px 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FFFDF9;
      border: 1.5px dashed ${theme.inkMuted};
      border-radius: 10px 6px 12px 7px;
    }
    .ending-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .ending-title {
      font-size: 12.5px;
      font-weight: 800;
      color: ${theme.markerDeep};
    }
    .ending-stats {
      font-size: 10.5px;
      font-weight: 600;
      color: ${theme.inkMuted};
    }
    .ending-stamp {
      border: 1.8px solid ${theme.markerDeep};
      color: ${theme.markerDeep};
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      transform: rotate(-6deg);
      box-shadow: inset 0 0 0 1px ${theme.markerSoft};
      letter-spacing: 0.5px;
    }
    /* 底部手绘涂鸦页脚 */
    .sketch-footer {
      height: 13px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 600;
      color: ${theme.inkMuted};
      padding: 0 2px;
      flex-shrink: 0;
    }
    .sketch-doodle-line {
      flex: 1;
      margin: 0 8px;
      height: 4px;
      border-bottom: 1.3px dotted ${theme.inkMuted};
      opacity: 0.55;
    }
  `;
}

async function measureAndPaginate(page, parsed, titleTag, cleanTitle, theme, fontSize, lineHeight, cardGap) {
  const fullFloorHTMLs = parsed.floors
    .map((f, idx) =>
      renderFloorSliceHTML(
        f,
        {
          isCont: false,
          quotes: f.quotes,
          paragraphs: f.paragraphs,
          sliceId: `f-${idx}`,
        },
        theme
      )
    )
    .join('\n');

  const allSysHTML = parsed.systemNotices
    .map((s) => `<div class="system-notice">[封帖归档] ${formatInlineMarkdown(s, true)}</div>`)
    .join('\n');

  const css = buildPageCSS(theme, fontSize, lineHeight, cardGap);
  const measureHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${css}</style>
    </head>
    <body>
      ${buildGlobalSketchSVGDefs()}
      <div class="xhs-card" id="measure-card" style="height: auto;">
        <div class="notebook-header" id="m-topbar">
          <span class="nb-left">✎ ${formatInlineMarkdown(parsed.boardName)}</span>
          <span class="nb-right">Page 01 / 01</span>
        </div>
        <div class="hero-memo-card" id="m-hero">
          <div class="washi-tape"></div>
          <div class="hero-sketch-box"></div>
          <div class="hero-content">
            <span class="sketch-topic-tag">#${formatInlineMarkdown(titleTag)}</span>
            <span class="title-text">${formatInlineMarkdown(cleanTitle)}</span>
          </div>
        </div>
        <div class="floors-container" id="m-floors">
          ${fullFloorHTMLs}
          <div id="m-sys-wrapper">${allSysHTML}</div>
        </div>
        <div class="sketch-footer" id="m-bottom">
          <span>白塔手札 · 树洞记录</span>
          <div class="sketch-doodle-line"></div>
          <span>next ↝</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(measureHTML, { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const topbarH = document.getElementById('m-topbar').getBoundingClientRect().height + 5;
    const heroH = document.getElementById('m-hero').getBoundingClientRect().height + 11;
    const bottomH = document.getElementById('m-bottom').getBoundingClientRect().height + 4;
    const sysH = document.getElementById('m-sys-wrapper').getBoundingClientRect().height;

    const floorEls = Array.from(document.querySelectorAll('.floor-item'));
    const floorDetails = floorEls.map((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;

      const headerEl = el.querySelector('.floor-header');
      const headerRect = headerEl.getBoundingClientRect();
      const headerStyle = window.getComputedStyle(headerEl);
      const headerH = headerRect.height + (parseFloat(headerStyle.marginBottom) || 0);

      const quoteEls = Array.from(el.querySelectorAll('.floor-quote'));
      const quotesH = quoteEls.reduce((acc, q) => {
        const qr = q.getBoundingClientRect();
        const qs = window.getComputedStyle(q);
        return acc + qr.height + (parseFloat(qs.marginBottom) || 0);
      }, 0);

      const pEls = Array.from(el.querySelectorAll('.floor-p'));
      const pHeights = pEls.map((p, idx) => {
        const pr = p.getBoundingClientRect();
        const ps = window.getComputedStyle(p);
        const mb = idx < pEls.length - 1 ? parseFloat(ps.marginBottom) || 0 : 0;
        return pr.height + mb;
      });

      const boxChrome = padTop + padBottom + headerH;

      return {
        totalH: rect.height,
        chromeH: boxChrome + quotesH,
        contChromeH: boxChrome,
        pHeights,
      };
    });

    return { topbarH, heroH, bottomH, sysH, floorDetails };
  });

  const usableCardH = 500 - 18 - metrics.topbarH - metrics.bottomH;
  const page1MaxH = usableCardH - metrics.heroH;
  const otherPageMaxH = usableCardH;

  const pages = [];
  let currentSlices = [];
  let usedH = 0;

  const getCurrentMaxH = () => (pages.length === 0 ? page1MaxH : otherPageMaxH);
  const pushPage = () => {
    if (currentSlices.length > 0) {
      pages.push({ slices: currentSlices, includeSys: false });
      currentSlices = [];
      usedH = 0;
    }
  };

  for (let i = 0; i < parsed.floors.length; i++) {
    const floor = parsed.floors[i];
    const detail = metrics.floorDetails[i];
    let maxH = getCurrentMaxH();
    const gapBefore = currentSlices.length > 0 ? cardGap : 0;

    if (usedH + gapBefore + detail.totalH <= maxH + 5) {
      currentSlices.push({
        floorIdx: i,
        isCont: false,
        quotes: floor.quotes,
        paragraphs: floor.paragraphs,
      });
      usedH += gapBefore + detail.totalH;
      continue;
    }

    const remainingH = maxH - usedH - gapBefore;
    const firstSliceMinH = detail.chromeH + (detail.pHeights[0] || 0);
    if (currentSlices.length > 0 && remainingH < firstSliceMinH) {
      pushPage();
      maxH = getCurrentMaxH();
      if (detail.totalH <= maxH + 5) {
        currentSlices.push({
          floorIdx: i,
          isCont: false,
          quotes: floor.quotes,
          paragraphs: floor.paragraphs,
        });
        usedH += detail.totalH;
        continue;
      }
    }

    let pCursor = 0;
    let isCont = false;
    while (pCursor < floor.paragraphs.length) {
      maxH = getCurrentMaxH();
      const g = currentSlices.length > 0 ? cardGap : 0;
      const baseChrome = isCont ? detail.contChromeH : detail.chromeH;

      if (currentSlices.length > 0 && usedH + g + baseChrome + detail.pHeights[pCursor] > maxH + 3) {
        pushPage();
        maxH = getCurrentMaxH();
      }

      const actualGap = currentSlices.length > 0 ? cardGap : 0;
      let sliceH = baseChrome;
      const sliceParas = [];
      while (
        pCursor < floor.paragraphs.length &&
        (sliceParas.length === 0 || usedH + actualGap + sliceH + detail.pHeights[pCursor] <= maxH + 3)
      ) {
        sliceH += detail.pHeights[pCursor];
        sliceParas.push(floor.paragraphs[pCursor]);
        pCursor++;
      }

      currentSlices.push({
        floorIdx: i,
        isCont,
        quotes: isCont ? [] : floor.quotes,
        paragraphs: sliceParas,
      });
      usedH += actualGap + sliceH;
      isCont = true;

      if (pCursor < floor.paragraphs.length) {
        pushPage();
      }
    }
  }

  if (currentSlices.length > 0) {
    const maxH = getCurrentMaxH();
    if (metrics.sysH > 0 && usedH + cardGap + metrics.sysH > maxH + 6 && currentSlices.length > 1) {
      const moveCount = currentSlices.length >= 3 ? 2 : 1;
      const movedSlices = currentSlices.splice(-moveCount);
      pages.push({ slices: currentSlices, includeSys: false });
      pages.push({ slices: movedSlices, includeSys: true, showEndingCard: true });
    } else {
      pages.push({
        slices: currentSlices,
        includeSys: true,
        showEndingCard: usedH + cardGap + metrics.sysH + 62 <= maxH,
      });
    }
  }

  return { pages, css, allSysHTML };
}

async function generateXHSImages(mdFilePath, customOutDir, options = {}) {
  const absMdPath = path.resolve(mdFilePath);
  if (!fs.existsSync(absMdPath)) {
    throw new Error(`找不到文件: ${absMdPath}`);
  }

  const mdContent = fs.readFileSync(absMdPath, 'utf8');
  const parsed = parseForumMarkdown(mdContent);
  const theme = resolveTheme(options, mdContent);

  if (parsed.floors.length === 0) {
    throw new Error('未能从 Markdown 文件中解析出任何楼层（需形如 **【0L 楼主】**）。');
  }

  const outDir = customOutDir
    ? path.resolve(customOutDir)
    : path.join(path.dirname(absMdPath), '小红书图片');

  fs.mkdirSync(outDir, { recursive: true });

  let titleTag = '树洞';
  let cleanTitle = parsed.title;
  const tagMatch = cleanTitle.match(/^【(.+?)】\s*(.+)$/);
  if (tagMatch) {
    titleTag = tagMatch[1];
    cleanTitle = tagMatch[2];
  }

  const pw = loadPlaywright();
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 375, height: 500 },
    deviceScaleFactor: 3, // 输出 1125x1500 高清图 (3:4)
  });
  const page = await context.newPage();

  const targetFont = options.fontSize || 15.5;
  const preset = {
    fontSize: targetFont,
    lineHeight: 1.48,
    cardGap: 7,
  };

  const { pages, css, allSysHTML } = await measureAndPaginate(
    page,
    parsed,
    titleTag,
    cleanTitle,
    theme,
    preset.fontSize,
    preset.lineHeight,
    preset.cardGap
  );
  const totalPages = pages.length;
  const targetIndices = options.pageNum
    ? [Math.max(0, Math.min(totalPages - 1, options.pageNum - 1))]
    : options.onlyFirstPage
      ? [0]
      : pages.map((_, i) => i);

  const cardsHTMLList = targetIndices.map((pageIdx) => {
    const p = pages[pageIdx];
    const isPage1 = pageIdx === 0;
    const pageNumStr = String(pageIdx + 1).padStart(2, '0');
    const totalNumStr = String(totalPages).padStart(2, '0');

    const heroHTML = isPage1
      ? `<div class="hero-memo-card">
           <div class="washi-tape"></div>
           <div class="hero-sketch-box"></div>
           <div class="hero-content">
             <span class="sketch-topic-tag">#${formatInlineMarkdown(titleTag)}</span>
             <span class="title-text">${formatInlineMarkdown(cleanTitle)}</span>
           </div>
         </div>`
      : '';

    const pageFloorsHTML = p.slices
      .map((s, sIdx) =>
        renderFloorSliceHTML(
          parsed.floors[s.floorIdx],
          {
            ...s,
            sliceId: `p${pageIdx}-s${sIdx}`,
          },
          theme
        )
      )
      .join('\n');

    const sysBlock = p.includeSys ? allSysHTML : '';
    const endingCardBlock = p.showEndingCard
      ? `<div class="ending-archive-card">
           <div class="ending-left">
             <div class="ending-title">✎ 白塔树洞 · 匿名手札归档</div>
             <div class="ending-stats">共 ${parsed.floors.length - 1} 条回帖 · 后勤喜糖派发中</div>
           </div>
           <div class="ending-stamp">已封帖珍藏</div>
         </div>`
      : '';

    return `
      <div class="xhs-card" id="card-page-${pageIdx + 1}">
        <div class="notebook-header">
          <span class="nb-left">✎ ${formatInlineMarkdown(parsed.boardName)}</span>
          <span class="nb-right">${pageNumStr} / ${totalNumStr}</span>
        </div>
        ${heroHTML}
        <div class="floors-container">
          ${pageFloorsHTML}
          ${sysBlock}
          ${endingCardBlock}
        </div>
        <div class="sketch-footer">
          <span>白塔手札 · 匿名树洞</span>
          <div class="sketch-doodle-line"></div>
          <span>${pageIdx + 1 === totalPages ? '[ END ]' : 'swipe ↝'}</span>
        </div>
      </div>
    `;
  });

  const isPartialRender = Boolean(options.onlyFirstPage || options.pageNum);
  if (!isPartialRender) {
    for (const existingFile of fs.readdirSync(outDir)) {
      if (/^\d+\.png$/.test(existingFile)) {
        fs.unlinkSync(path.join(outDir, existingFile));
      }
    }
  }

  const generatedFiles = [];
  for (let idx = 0; idx < cardsHTMLList.length; idx++) {
    const realPageNum = targetIndices[idx] + 1;
    const singlePageHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        ${buildGlobalSketchSVGDefs()}
        ${cardsHTMLList[idx]}
      </body>
      </html>
    `;
    await page.setContent(singlePageHTML, { waitUntil: 'load' });
    const fileName = options.customPrefix
      ? `${options.customPrefix}.png`
      : `${String(realPageNum).padStart(2, '0')}.png`;
    const filePath = path.join(outDir, fileName);
    const cardEl = await page.$('.xhs-card');
    await cardEl.screenshot({ path: filePath });
    generatedFiles.push(filePath);
  }

  if (!isPartialRender) {
    const previewHTMLPath = path.join(outDir, 'preview.html');
    const previewHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${formatInlineMarkdown(cleanTitle)} - 手绘草稿风预览 (共${totalPages}张)</title>
        <style>
          ${css}
          body {
            padding: 32px;
            background: #262320;
          }
          .preview-header {
            color: #F7F3EB;
            margin-bottom: 24px;
            text-align: center;
          }
          .preview-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            justify-content: center;
          }
          .xhs-card {
            box-shadow: 6px 6px 0px rgba(0,0,0,0.35);
            border: 2px solid #362D26;
          }
        </style>
      </head>
      <body>
        ${buildGlobalSketchSVGDefs()}
        <div class="preview-header">
          <h2>✎ 小红书 3:4 手绘草稿手账风预览（${theme.label} · 共 ${totalPages} 张）</h2>
        </div>
        <div class="preview-grid">
          ${cardsHTMLList.join('\n')}
        </div>
      </body>
      </html>
    `;
    fs.writeFileSync(previewHTMLPath, previewHTML, 'utf8');
  }

  await browser.close();

  console.log(JSON.stringify({
    status: 'success',
    themeId: theme.id,
    themeName: theme.label,
    source: absMdPath,
    outputDir: outDir,
    totalPages,
    mobileFontSizePt: preset.fontSize,
    totalFloors: parsed.floors.length,
    files: generatedFiles,
  }, null, 2));
}

const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--list-themes')) {
  console.log('✎ 可用手绘预设色系 (--theme=名称)：');
  for (const [k, v] of Object.entries(PRESET_THEMES)) {
    console.log(`  - ${k.padEnd(15)} : ${v.label}`);
  }
  console.log('\n🎲 随机或自定义手绘色系：');
  console.log('  - --random 或 --theme=random : 随机生成一套手绘水彩/马克笔色系');
  console.log('  - --color=#HEX色号           : 根据任意十六进制颜色生成手绘配色');
  console.log('  - --hue=0~360                : 根据任意色相角生成手绘配色');
  process.exit(0);
}

const getArgVal = (prefix) => {
  const found = rawArgs.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
};

const options = {
  theme: getArgVal('--theme='),
  color: getArgVal('--color='),
  hue: getArgVal('--hue=') !== null ? parseFloat(getArgVal('--hue=')) : null,
  fontSize: getArgVal('--font=') !== null ? parseFloat(getArgVal('--font=')) : null,
  pageNum: getArgVal('--page=') !== null ? parseInt(getArgVal('--page='), 10) : null,
  random: rawArgs.includes('--random'),
  onlyFirstPage: rawArgs.includes('--first-only'),
  customPrefix: getArgVal('--prefix='),
};

const posArgs = rawArgs.filter((a) => !a.startsWith('--'));

if (posArgs.length < 1) {
  console.error('用法: node 生成小红书论坛体图片.js <markdown文件路径> [输出目录] [--theme=warm-orange|--random|--color=#HEX]');
  process.exit(1);
}

generateXHSImages(posArgs[0], posArgs[1], options).catch((err) => {
  console.error('生成失败:', err.message);
  process.exit(1);
});
