// Center-screen aim ray against a spherical target. Target positions are
// already in world space, so no per-frame mesh matrix or triangle walk is needed.
export function rayHitsSphere(ray, center, radius) {
  const dx = center.x - ray.origin.x
  const dy = center.y - ray.origin.y
  const dz = center.z - ray.origin.z
  const forward = dx * ray.direction.x + dy * ray.direction.y + dz * ray.direction.z
  if (forward < 0) return false
  const distanceSquared = dx * dx + dy * dy + dz * dz - forward * forward
  return distanceSquared <= radius * radius
}
