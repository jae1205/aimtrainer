export const DEFAULT_WEAPON = {
  id: 'default',
  name: { kr: '기본 권총', en: 'STANDARD PISTOL' },
  collection: 'AIMFORGE STANDARD',
  preview: '/models/pistol-preview.glb',
  model: '/models/pistol-ads.glb?v=2',
  offset: [0, -0.94, -0.9],
}

export const WEAPON_SKINS = [
  DEFAULT_WEAPON,
  {
    id: 'revolver',
    name: { kr: '리볼버', en: 'REVOLVER' },
    collection: 'CLASSIC REVOLVER',
    preview: '/models/revolver-source.glb',
    model: '/models/revolver-ads.glb?v=1',
    offset: [0, -0.94, -0.9],
    viewScale: 1.1,
  },
  {
    id: 'banana',
    name: { kr: '바나나', en: 'BANANA' },
    collection: 'GOLDEN CURVE',
    preview: '/models/banana-source.glb',
    model: '/models/banana-ads.glb?v=1',
    offset: [0, -1.08, -1],
  },
]

export function getWeaponSkin(id) {
  return WEAPON_SKINS.find(skin => skin.id === id) || DEFAULT_WEAPON
}

export function getEquippedWeapon() {
  return getWeaponSkin(localStorage.getItem('weaponSkin'))
}
