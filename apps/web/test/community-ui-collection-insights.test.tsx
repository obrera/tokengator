import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { CommunityUiCollectionInsights } from '../src/features/community/ui/community-ui-collection-insights'

const selectedCollection = {
  address: 'collection-alpha',
  facetTotals: {},
  id: 'collection-alpha',
  imageUrl: 'https://example.com/collection-alpha.png',
  label: 'Alpha Collection',
  symbolMagicEden: null,
  type: 'collection' as const,
}

describe('CommunityUiCollectionInsights', () => {
  test('renders populated, no-trait, and empty states', () => {
    const populatedMarkup = renderToStaticMarkup(
      <CommunityUiCollectionInsights
        insights={{
          assetTotal: 2,
          traitGroups: [
            {
              groupId: 'background',
              label: 'Background',
              options: [
                {
                  label: 'Forest',
                  total: 1,
                  value: 'forest',
                },
              ],
              total: 1,
            },
          ],
        }}
        selectedCollection={selectedCollection}
      />,
    )
    const noTraitMarkup = renderToStaticMarkup(
      <CommunityUiCollectionInsights
        insights={{
          assetTotal: 2,
          traitGroups: [],
        }}
        selectedCollection={selectedCollection}
      />,
    )
    const emptyMarkup = renderToStaticMarkup(
      <CommunityUiCollectionInsights
        insights={{
          assetTotal: 0,
          traitGroups: [],
        }}
        selectedCollection={selectedCollection}
      />,
    )

    expect(populatedMarkup).toContain('Alpha Collection')
    expect(populatedMarkup).toContain('Background')
    expect(populatedMarkup).toContain('Forest')
    expect(noTraitMarkup).toContain('No indexed traits')
    expect(emptyMarkup).toContain('No indexed assets')
  })

  test('collapses long trait option lists behind a show more control', () => {
    const markup = renderToStaticMarkup(
      <CommunityUiCollectionInsights
        insights={{
          assetTotal: 25,
          traitGroups: [
            {
              groupId: 'background',
              label: 'Background',
              options: Array.from({ length: 25 }).map((_, index) => ({
                label: `Option ${String(index).padStart(2, '0')}`,
                total: 1,
                value: `option-${String(index).padStart(2, '0')}`,
              })),
              total: 25,
            },
          ],
        }}
        selectedCollection={selectedCollection}
      />,
    )

    expect(markup).toContain('Option 19')
    expect(markup).not.toContain('Option 20')
    expect(markup).toContain('Show 5 more')
  })
})
