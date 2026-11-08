/**
 * 【品类一：OC 原创 (Original Character)】
 * 视觉风格：去 AI 感 · 手绘草稿手账风 UI
 * 支持 7 套预设手绘水彩/马克笔色系 (默认 warm-orange 暖杏甜橘)、--random 随机色系与 --color 自定义色系
 */

const { formatInlineMarkdown, splitCoverTitleLines } = require('./common');

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
    category: 'oc',
    id: customMeta.id || `hue-${h}`,
    label: customMeta.label || `手绘自定义色系 (Hue=${h}°)`,
    paperBg: customMeta.paperBg || `hsl(${h}, 38%, 96.2%)`,
    gridLine: customMeta.gridLine || `hsla(${h}, 28%, 76%, 0.38)`,
    marginLine: customMeta.marginLine || `hsla(${h}, 55%, 68%, 0.42)`,
    inkColor: customMeta.inkColor || '#362E29',
    inkMuted: customMeta.inkMuted || '#7A6E65',
    markerSolid: customMeta.markerSolid || `hsl(${h}, 76%, 62%)`,
    markerDeep: customMeta.markerDeep || `hsl(${h}, 72%, 38%)`,
    markerSoft: customMeta.markerSoft || `hsl(${h}, 82%, 88%)`,
    highlighter: customMeta.highlighter || `hsla(${h}, 90%, 74%, 0.52)`,
    opCardFill: customMeta.opCardFill || `hsl(${h}, 65%, 97.8%)`,
    opShadow: customMeta.opShadow || `hsl(${h}, 62%, 80%)`,
    anonCardFill: '#FFFEFC',
    anonShadow: customMeta.anonShadow || `hsl(${h}, 26%, 85%)`,
    tapeBg: customMeta.tapeBg || `hsla(${h}, 78%, 78%, 0.62)`,
    tapeStripe: customMeta.tapeStripe || `hsla(${h}, 70%, 58%, 0.25)`,
    darkCardFill: customMeta.darkCardFill || '#282422',
    darkCardShadow: customMeta.darkCardShadow || `hsl(${h}, 45%, 72%)`,
    darkAccent: customMeta.darkAccent || '#F6AD55',
  };
}

/**
 * 7 套内置 OC 手绘水彩/马克笔主题色系（默认 warm-orange 暖杏甜橘）
 */
const OC_PRESET_THEMES = {
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

/**
 * OC 简笔画涂鸦头像 SVG
 */
function getOCAvatarSVG(floor, theme) {
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
    return `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19.5" cy="20.5" r="9.5" fill="${spot}"/>
        <path d="M10 17L11.5 10.5L15.8 14.2C17.2 13.8 19 13.8 20.5 14.2L24.8 10.2L26.2 17C27.5 20.5 26.2 26.8 21.5 28.2C16.8 29.5 12.2 28.2 10.5 24.8C9.2 22.2 9.5 19 10 17Z" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="15" cy="20.5" r="1.2" fill="${ink}"/>
        <circle cx="21" cy="20.5" r="1.2" fill="${ink}"/>
        <path d="M17.2 22.5L18.2 23.3L19.2 22.5" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;
  } else if (styleIdx === 1) {
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

function getOCBadgeHTML(floor) {
  if (floor.isOP) {
    return { roleClass: 'role-op', badgeHTML: '<span class="sketch-stamp stamp-op">楼主</span>' };
  }
  if (floor.isSpecialUser) {
    return { roleClass: 'role-special', badgeHTML: '<span class="sketch-stamp stamp-special">刚注册</span>' };
  }
  return { roleClass: 'role-anon', badgeHTML: '' };
}

function buildOCCSS(theme, fontSize = 15.6, lineHeight = 1.48, cardGap = 7) {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background: #1B2230;
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Hiragino Sans GB", sans-serif;
      color: ${theme.inkColor};
    }
    /* 375px 手机原生宽度 + 高度自适应：方格手账草稿本底纸 */
    .xhs-card {
      width: 375px;
      height: auto;
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
    #card-cover {
      height: 500px;
    }
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
      font-weight: 800;
      color: ${theme.inkMuted};
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .nb-right {
      font-family: "Bradley Hand", "Chalkboard SE", "Comic Sans MS", "PingFang SC", monospace;
      font-size: 11.5px;
      font-weight: 800;
      color: ${theme.inkColor};
    }
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
    .floors-container {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: ${cardGap}px;
      overflow: visible;
      padding-right: 3px;
      padding-bottom: 3px;
    }
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
    .system-notice {
      position: relative;
      padding: 6px 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: ${theme.inkColor};
      background: ${theme.markerSoft};
      border: 1.6px dashed ${theme.inkColor};
      border-radius: 8px 12px 9px 11px;
    }
    .ending-archive-card {
      margin-top: 6px;
      position: relative;
      padding: 7px 11px;
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
    /* ==================== OC 专属手绘封面 (00-封面.png) 样式 ==================== */
    .cover-Wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6px 4px 4px 4px;
    }
    .cover-hero-card {
      position: relative;
      margin: auto 0;
      padding: 28px 8px 24px 8px;
      text-align: center;
    }
    .cover-hero-box {
      position: absolute;
      inset: 0;
      background: #FFFDF9;
      border: 2.4px solid ${theme.inkColor};
      border-radius: 16px 6px 14px 7px / 7px 14px 6px 16px;
      box-shadow: 5px 5px 0px ${theme.opShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .cover-washi {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%) rotate(-2deg);
      width: 108px;
      height: 18px;
      background-color: ${theme.tapeBg};
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        ${theme.tapeStripe} 4px,
        ${theme.tapeStripe} 8px
      );
      border-left: 1.5px dotted rgba(255,255,255,0.75);
      border-right: 1.5px dotted rgba(255,255,255,0.75);
      filter: url(#sketch-wobble);
      z-index: 2;
    }
    .cover-hero-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cover-tags-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .cover-tag {
      background: ${theme.markerSoft};
      color: ${theme.markerDeep};
      border: 1.4px solid ${theme.inkColor};
      border-radius: 7px 3px 6px 4px;
      font-size: 12px;
      font-weight: 800;
      padding: 2px 9px;
      transform: rotate(-1deg);
    }
    .cover-tag.tag-outline {
      background: #FFFEFC;
      color: ${theme.inkColor};
      border-style: dashed;
      transform: rotate(1deg);
    }
    .cover-main-title {
      font-size: 36px;
      font-weight: 900;
      line-height: 1.34;
      color: ${theme.inkColor};
      letter-spacing: 0.4px;
      margin-bottom: 16px;
    }
    .cover-meta-bar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1.5px dashed ${theme.inkMuted};
      font-size: 11.5px;
      font-weight: 700;
      color: ${theme.inkMuted};
    }
    .cover-highlights-box {
      position: relative;
      padding: 9px 11px;
    }
    .cover-hl-border {
      position: absolute;
      inset: 0;
      background: #FFFEFC;
      border: 1.5px dashed ${theme.inkColor};
      border-radius: 10px 14px 9px 12px;
      box-shadow: 2.5px 2.5px 0px ${theme.anonShadow};
      filter: url(#sketch-wobble);
      z-index: 0;
    }
    .cover-hl-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4.5px;
    }
    .cover-hl-title {
      font-size: 11px;
      font-weight: 800;
      color: ${theme.markerDeep};
      margin-bottom: 1px;
    }
    .cover-hl-item {
      font-size: 12px;
      line-height: 1.38;
      color: ${theme.inkColor};
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}

function renderOCCoverCardHTML(parsed, titleTag, cleanTitle) {
  const opFloor = parsed.floors.find((f) => f.isOP) || parsed.floors[0];
  const { line1: ocLine1, line2: ocLine2 } = splitCoverTitleLines(cleanTitle);
  const dynamicTitleSize = 36;
  const highlightedTitle = `${formatInlineMarkdown(ocLine1)}<br/>${formatInlineMarkdown(ocLine2)}`;

  return `
    <div class="xhs-card" id="card-cover">
      <div class="notebook-header">
        <span class="nb-left">✎ ${formatInlineMarkdown(parsed.boardName)}</span>
        <span class="nb-right">COVER · 全文完结</span>
      </div>
      <div class="cover-Wrap">
        <div class="cover-hero-card">
          <div class="cover-washi"></div>
          <div class="cover-hero-box"></div>
          <div class="cover-hero-inner">
            <div class="cover-tags-row">
              <span class="cover-tag">#${formatInlineMarkdown(titleTag)}</span>
              <span class="cover-tag tag-outline">#向导哨兵</span>
              <span class="cover-tag tag-outline">#纯正论坛体</span>
            </div>
            <div class="cover-main-title" style="font-size: ${dynamicTitleSize}px;">${highlightedTitle}</div>
            <div class="cover-meta-bar">
              <span>楼主：${formatInlineMarkdown(opFloor.author)}</span>
              <span>共 ${parsed.floors.length - 1} 条回帖 · 已锁帖珍藏</span>
            </div>
          </div>
        </div>

        <div class="cover-highlights-box">
          <div class="cover-hl-border"></div>
          <div class="cover-hl-inner">
            <div class="cover-hl-title">✎ 楼内高赞吃瓜热评：</div>
            <div class="cover-hl-item">↳ #1L：精神体是黑豹还关人三天，除了顶楼那位活阎王还有谁？！</div>
            <div class="cover-hl-item">↳ #12L：什么防走丢环，那是他提前给你定制的全塔唯一旧伤理疗环！</div>
            <div class="cover-hl-item">↳ #38L：二十七根旧发圈收在床头……姐妹他暗恋你五年在筑巢啊！</div>
          </div>
        </div>
      </div>
      <div class="sketch-footer">
        <span>白塔手札 · 匿名树洞</span>
        <div class="sketch-doodle-line"></div>
        <span>左滑看全楼吃瓜 ↝</span>
      </div>
    </div>
  `;
}

function getOCPageMeta(parsed) {
  return {
    topbarLeftHTML: `✎ ${formatInlineMarkdown(parsed.boardName)}`,
    footerLeftText: '白塔手札 · 匿名树洞',
    footerNextText: 'swipe ↝',
    footerEndText: '[ END ]',
    endingTitleText: '✎ 白塔树洞 · 匿名手札归档',
    endingStatsText: `共 ${parsed.floors.length - 1} 条回帖 · 后勤喜糖派发中`,
    endingStampText: '已封帖珍藏',
    pageBgWatermarkHTML: '',
    heroWatermarkHTML: '',
  };
}

module.exports = {
  categoryId: 'oc',
  categoryName: 'OC 原创（手绘草稿手账风）',
  hexToHue,
  createSketchThemeFromHue,
  OC_PRESET_THEMES,
  buildGlobalSketchSVGDefs,
  getAvatarSVG: getOCAvatarSVG,
  getBadgeHTML: getOCBadgeHTML,
  buildCSS: buildOCCSS,
  renderCoverCardHTML: renderOCCoverCardHTML,
  getPageMeta: getOCPageMeta,
};
