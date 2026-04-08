export const availableAvatarIds = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
  "avatar-6"
] as const;

export type AvatarId = (typeof availableAvatarIds)[number];

export function getAvatarPath(avatarId?: string | null) {
  if (!avatarId) {
    return null;
  }

  return `/avatars/${avatarId}.png`;
}

export function getSeededAvatarPath(name: string, rank: number) {
  const seed = `${name}-${rank}`
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const avatarIndex = (seed % availableAvatarIds.length) + 1;

  return `/avatars/avatar-${avatarIndex}.png`;
}

export function assignAvatarId(usedAvatarIds: Array<string | null | undefined>) {
  const used = new Set(
    usedAvatarIds.filter((avatarId): avatarId is string => Boolean(avatarId))
  );
  const available = availableAvatarIds.filter((avatarId) => !used.has(avatarId));
  const source = available.length > 0 ? available : availableAvatarIds;

  return source[Math.floor(Math.random() * source.length)];
}
