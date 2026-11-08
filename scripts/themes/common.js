/**
 * 论坛体图片渲染公共辅助工具
 * 供各品类主题模块 (themes/oc.js, themes/glory.js 等) 与主引擎共同调用
 */

function formatInlineMarkdown(text, isSpecialCard = false) {
  let escaped = String(text || '')
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
  splitCoverTitleLines,
};
