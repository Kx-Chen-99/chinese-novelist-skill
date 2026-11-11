/**
 * 论坛体图片渲染公共辅助工具
 * 供各品类主题模块 (themes/oc.js, themes/glory.js, themes/dragon.js) 与主引擎共同调用
 */

function formatInlineMarkdown(text, isSpecialCard = false) {
  let escaped = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`(.+?)`/g, '<span class="inline-code">$1</span>');
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">$1</span>');
  escaped = escaped.replace(/\[(点击跳转|点击查看|查看详情)\]/g, '<span class="md-link">[$1]</span>');
  escaped = escaped.replace(/@([^\s，。！？、：；]+)/g, '<span class="mention">@$1</span>');

  if (!isSpecialCard) {
    escaped = escaped.replace(/「([^」]+)」/g, '<span class="marker-highlight">「$1」</span>');
  }

  return escaped;
}

/**
 * 将单条段落或 Markdown 列表项（- /   - / 1. ）渲染为结构化 HTML
 * 若原始段落末尾带有 [[PARA_GAP]] 标记（表示 Markdown 中有空行分段），自动附加 para-gap 类名以拉开段落间距
 */
function renderParagraphOrListHTML(p, pIdx, isSpecialCard = false) {
  let raw = String(p || '');
  let hasParaGap = false;
  if (raw.endsWith('[[PARA_GAP]]')) {
    hasParaGap = true;
    raw = raw.slice(0, -'[[PARA_GAP]]'.length);
  }
  const gapClass = hasParaGap ? ' para-gap' : '';

  // 二级缩进无序列表（如 "  - **A组**：..."）
  const subBulletMatch = raw.match(/^\s{2,}[-*•]\s+(.+)$/);
  if (subBulletMatch) {
    return `<div class="floor-p floor-li floor-li-sub${gapClass}" data-p-idx="${pIdx}"><span class="li-bullet li-bullet-sub"></span><span class="li-text">${formatInlineMarkdown(subBulletMatch[1].trim(), isSpecialCard)}</span></div>`;
  }

  // 一级无序列表（如 "- **上半区**：" 或 "- 投票前台完全匿名..."）
  const bulletMatch = raw.match(/^\s*[-*•]\s+(.+)$/);
  if (bulletMatch) {
    return `<div class="floor-p floor-li${gapClass}" data-p-idx="${pIdx}"><span class="li-bullet"></span><span class="li-text">${formatInlineMarkdown(bulletMatch[1].trim(), isSpecialCard)}</span></div>`;
  }

  // 有序列表（如 "1. **榜单定义**："）
  const numMatch = raw.match(/^\s*(\d+)\.\s+(.+)$/);
  if (numMatch) {
    return `<div class="floor-p floor-li floor-li-num${gapClass}" data-p-idx="${pIdx}"><span class="li-num">${numMatch[1]}.</span><span class="li-text">${formatInlineMarkdown(numMatch[2].trim(), isSpecialCard)}</span></div>`;
  }

  return `<p class="floor-p${gapClass}" data-p-idx="${pIdx}">${formatInlineMarkdown(raw.trim(), isSpecialCard)}</p>`;
}

/**
 * 将长标题智能拆分为两行大标题（供封面图使用）
 */
function splitCoverTitleLines(cleanTitle) {
  const raw = String(cleanTitle || '').trim();
  let line1 = '';
  let line2 = '';

  if (raw.includes('：')) {
    const parts = raw.split('：');
    line1 = parts[0].trim();
    line2 = parts.slice(1).join('：').trim();
  } else if (raw.includes('《') && raw.indexOf('《') > 1) {
    const idx = raw.indexOf('《');
    line1 = raw.slice(0, idx).trim();
    line2 = raw.slice(idx).trim();
  } else if (raw.length > 6) {
    const mid = Math.ceil(raw.length / 2);
    line1 = raw.slice(0, mid);
    line2 = raw.slice(mid);
  } else {
    line1 = '荣耀官方论坛热帖';
    line2 = raw;
  }

  const size1 = line1.length <= 8 ? 35 : line1.length <= 10 ? 30 : 26;
  const size2 = line2.length <= 7 ? 40 : line2.length <= 9 ? 34 : 28;

  return { line1, line2, size1, size2 };
}

module.exports = {
  formatInlineMarkdown,
  renderParagraphOrListHTML,
  splitCoverTitleLines,
};
