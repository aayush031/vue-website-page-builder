const WRAPPER_ATTR = 'data-translate-key'

export const TRANSLATABLE_STRINGS: readonly string[] = [
  'Layouts and visual.',
  'Start customizing by editing this default text directly in the editor.',
  'New landing page block',
  'Build a polished page with blocks that already look consistent.',
  'Change the message, swap the image, and adjust spacing, colors, and typography from the sidebar.',
  'Start now',
  'See details',
  'Pages launched',
  'Reusable blocks',
  'Time to publish',
  'Same day',
  'Primary benefit',
  'Blocks stay responsive across screens.',
  'Editing support',
  'Text, image, padding, color, font size.',
  'Feature blocks that explain the value of the page at a glance.',
  'Use this section for product features, service highlights, or anything that needs three clean points with consistent spacing and typography.',
  'Structured editing',
  'Users can update headings, paragraphs, buttons, and imagery without breaking the layout.',
  'Responsive by default',
  'The grid collapses cleanly across mobile, tablet, and desktop so the content remains readable everywhere.',
  'Design controls',
  'Padding, colors, font size, and other visual settings can be adjusted to match the rest of the page.',
  'Social proof that feels at home with the rest of the builder.',
  'Use testimonials to add trust, customer voice, and a clear sense of real-world results.',
  'This layout stays balanced even when the quote grows a little longer.',
  'Teams can replace the image, update the name, and fine-tune styling from the sidebar.',
  'It gives the page a more complete marketing flow after features and before the footer.',
  'Sarah Johnson',
  'Marketing Lead',
  'Daniel Rivera',
  'Product Manager',
  'Amina Patel',
  'Founder',
  'My Brand',
  'Use this space for a short brand summary or support message.',
  'Product',
  'Features',
  'Templates',
  'Pricing',
  'Company',
  'About',
  'Careers',
  'Contact',
  'Newsletter',
  'Use this space for updates, support notes, or any closing message you want at the bottom of the page.',
  'Subscribe',
  'Support',
  'Copyright 2026 My Brand. All rights reserved.',
  'Privacy',
  'Terms',
  'LinkedIn',
  'YourBrand',
  'v2.0 New',
  'Use Cases',
  'About Us',
  'Sign in',
  'Get started →',
  'Landing Page',
  'Navbar With Badge',
  'Hero Split Spotlight',
  'Features Grid Cards',
  'Testimonials Three Column',
  'Footer Multi Column',
] as const

const SORTED_KEYS = [...TRANSLATABLE_STRINGS].sort((a, b) => b.length - a.length)

function hasIgnoredAncestor(node: Node): boolean {
  let parent = node.parentNode
  while (parent) {
    if (parent instanceof HTMLElement) {
      if (
        parent.hasAttribute(WRAPPER_ATTR) ||
        parent.tagName === 'SCRIPT' ||
        parent.tagName === 'STYLE' ||
        parent.tagName === 'NOSCRIPT' ||
        parent.tagName === 'TEXTAREA'
      ) {
        return true
      }
    }
    parent = parent.parentNode
  }
  return false
}

function replaceMatchesInTextNode(
  textNode: Text,
  translate: (key: string) => string,
  ownerDocument: Document,
): boolean {
  const source = textNode.nodeValue || ''
  if (!source.trim()) return false
  if (hasIgnoredAncestor(textNode)) return false

  let nodes: Array<Text | HTMLElement> = [ownerDocument.createTextNode(source)]

  for (const key of SORTED_KEYS) {
    const nextNodes: Array<Text | HTMLElement> = []

    for (const node of nodes) {
      if (!(node instanceof Text)) {
        nextNodes.push(node)
        continue
      }

      const value = node.nodeValue || ''
      if (!value.includes(key)) {
        nextNodes.push(node)
        continue
      }

      const parts = value.split(key)
      for (let i = 0; i < parts.length; i++) {
        const textPart = parts[i]
        if (textPart.length > 0) {
          nextNodes.push(ownerDocument.createTextNode(textPart))
        }

        if (i < parts.length - 1) {
          const span = ownerDocument.createElement('span')
          span.setAttribute(WRAPPER_ATTR, key)
          span.textContent = translate(key)
          nextNodes.push(span)
        }
      }
    }

    nodes = nextNodes
  }

  const containsWrapper = nodes.some(
    (node) => node instanceof HTMLElement && node.hasAttribute(WRAPPER_ATTR),
  )
  if (!containsWrapper) return false

  const fragment = ownerDocument.createDocumentFragment()
  for (const node of nodes) {
    fragment.appendChild(node)
  }

  textNode.replaceWith(fragment)
  return true
}

function migrateLegacyNodes(root: ParentNode, translate: (key: string) => string): void {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument
  if (!ownerDocument) return

  const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    if (current instanceof Text) {
      textNodes.push(current)
    }
    current = walker.nextNode()
  }

  for (const textNode of textNodes) {
    replaceMatchesInTextNode(textNode, translate, ownerDocument)
  }
}

export function injectTranslateAttributes(
  html: string,
  translate: (key: string) => string,
): string {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  migrateLegacyNodes(wrapper, translate)
  return wrapper.innerHTML
}

export function translateHtmlWithRegistry(
  html: string,
  translate: (key: string) => string,
): string {
  return injectTranslateAttributes(html, translate)
}

export function retranslateAllBlocks(translate: (key: string) => string): void {
  const pageBuilder = document.querySelector('#pagebuilder')
  if (!pageBuilder) return

  pageBuilder.querySelectorAll(`[${WRAPPER_ATTR}]`).forEach((node) => {
    const key = node.getAttribute(WRAPPER_ATTR)
    if (!key) return
    node.textContent = translate(key)
  })

  migrateLegacyNodes(pageBuilder, translate)
}
