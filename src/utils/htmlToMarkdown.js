// Convierte HTML de TipTap a Markdown para usarlo como cuerpo de Pull Requests.
// Cubre los elementos que genera el RichTextEditor: encabezados, parrafos,
// negrita/cursiva, listas, task lists, links, codigo y citas.
// Las imagenes base64 se omiten para no inflar el cuerpo del PR; las imagenes
// con URL http(s) se conservan como enlace markdown.

const INLINE_WRAPPERS = {
  STRONG: '**', B: '**',
  EM: '_', I: '_',
  CODE: '`',
  S: '~~', DEL: '~~', STRIKE: '~~'
};

const renderInline = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName;
  const inner = Array.from(node.childNodes).map(renderInline).join('');

  if (tag === 'BR') return '\n';
  if (tag === 'A') {
    const href = node.getAttribute('href');
    return href ? `[${inner}](${href})` : inner;
  }
  if (tag === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) return '';
    const alt = node.getAttribute('alt') || 'imagen';
    return `![${alt}](${src})`;
  }
  const wrap = INLINE_WRAPPERS[tag];
  if (wrap) {
    const trimmed = inner.trim();
    return trimmed ? `${wrap}${trimmed}${wrap}` : '';
  }
  return inner;
};

const renderList = (listNode, ordered, depth) => {
  const indent = '  '.repeat(depth);
  const isTaskList = listNode.getAttribute('data-type') === 'taskList';
  const lines = [];
  let index = 1;

  Array.from(listNode.children).forEach((li) => {
    if (li.tagName !== 'LI') return;

    let marker;
    if (isTaskList) {
      const checked = li.getAttribute('data-checked') === 'true';
      marker = checked ? '- [x]' : '- [ ]';
    } else {
      marker = ordered ? `${index}.` : '-';
    }

    // Texto directo del item (excluyendo sublistas)
    const inlineParts = [];
    const nestedLists = [];
    Array.from(li.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === 'UL' || child.tagName === 'OL')) {
        nestedLists.push(child);
      } else {
        inlineParts.push(renderInline(child));
      }
    });

    const text = inlineParts.join('').trim();
    lines.push(`${indent}${marker} ${text}`);

    nestedLists.forEach((nested) => {
      lines.push(renderList(nested, nested.tagName === 'OL', depth + 1));
    });

    index += 1;
  });

  return lines.join('\n');
};

const renderBlock = (node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? text : '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName;

  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    return `${'#'.repeat(level)} ${renderInline(node).trim()}`;
  }
  if (tag === 'P') {
    return renderInline(node).trim();
  }
  if (tag === 'UL' || tag === 'OL') {
    return renderList(node, tag === 'OL', 0);
  }
  if (tag === 'BLOCKQUOTE') {
    return Array.from(node.childNodes)
      .map(renderBlock)
      .filter(Boolean)
      .join('\n\n')
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }
  if (tag === 'PRE') {
    return `\`\`\`\n${node.textContent.replace(/\n$/, '')}\n\`\`\``;
  }
  if (tag === 'HR') return '---';

  // Contenedor generico: procesar hijos como bloques
  const childBlocks = Array.from(node.childNodes).map(renderBlock).filter(Boolean);
  if (childBlocks.length) return childBlocks.join('\n\n');

  return renderInline(node).trim();
};

export const htmlToMarkdown = (html) => {
  if (!html || typeof html !== 'string') return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const blocks = Array.from(doc.body.childNodes)
      .map(renderBlock)
      .filter(Boolean);
    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    // Fallback: quitar etiquetas
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
};
