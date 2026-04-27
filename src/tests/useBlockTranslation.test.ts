// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  injectTranslateAttributes,
  retranslateAllBlocks,
} from '../composables/useBlockTranslation'

describe('useBlockTranslation', () => {
  const translate = (key: string) => `T:${key}`

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('injectTranslateAttributes stamps translate keys and applies translation text', () => {
    const html =
      '<section><h2>Layouts and visual.</h2><p>Start customizing by editing this default text directly in the editor.</p></section>'

    const result = injectTranslateAttributes(html, translate)
    const wrapper = document.createElement('div')
    wrapper.innerHTML = result

    const translatedNodes = wrapper.querySelectorAll('[data-translate-key]')
    expect(translatedNodes.length).toBe(2)
    expect(translatedNodes[0].textContent).toBe('T:Layouts and visual.')
    expect(translatedNodes[1].textContent).toBe(
      'T:Start customizing by editing this default text directly in the editor.',
    )
  })

  it('retranslateAllBlocks updates already stamped nodes', () => {
    document.body.innerHTML = `
      <div id="pagebuilder">
        <span data-translate-key="Layouts and visual.">Old</span>
      </div>
    `

    retranslateAllBlocks(translate)

    const node = document.querySelector('#pagebuilder [data-translate-key="Layouts and visual."]')
    expect(node?.textContent).toBe('T:Layouts and visual.')
  })

  it('retranslateAllBlocks migrates legacy text nodes and stamps translate keys', () => {
    document.body.innerHTML = `
      <div id="pagebuilder">
        <p>Layouts and visual.</p>
      </div>
    `

    retranslateAllBlocks(translate)

    const node = document.querySelector('#pagebuilder [data-translate-key="Layouts and visual."]')
    expect(node).not.toBeNull()
    expect(node?.textContent).toBe('T:Layouts and visual.')
  })
})
