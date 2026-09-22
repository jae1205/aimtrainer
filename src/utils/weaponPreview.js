import { Box3, Group, Vector3 } from 'three'

const PREVIEW_WIDTH = 2
const PREVIEW_HEIGHT = 1.8

export function createPreviewModel(scene) {
  const model = scene.clone(true)
  const bounds = new Box3().setFromObject(model, true)
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  const centered = new Group()
  centered.position.copy(center).negate()
  centered.add(model)

  const normalized = new Group()
  // Scale the entire model uniformly; never stretch its geometry or alter the game asset.
  normalized.scale.setScalar(PREVIEW_WIDTH / Math.max(size.x, 0.001))
  normalized.add(centered)
  return normalized
}

export function getPreviewZoom(width, height) {
  // A shared camera frame keeps all three silhouettes equally wide at every breakpoint.
  return Math.max(1, Math.min(width * 0.78 / PREVIEW_WIDTH, height * 0.84 / PREVIEW_HEIGHT))
}
