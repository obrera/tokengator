function getAssetGroupFallbackImageUrl(id: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(`asset-group:${id}`)}`
}

export function getAssetGroupImageUrl(input: { id: string; imageUrl: string | null }) {
  return input.imageUrl?.trim() || getAssetGroupFallbackImageUrl(input.id)
}
