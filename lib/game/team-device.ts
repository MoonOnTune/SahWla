const TEAM_DEVICE_COOKIE_PREFIX = "sahwla_team_device_";

export function getTeamDeviceCookieName(roomCode: string): string {
  return `${TEAM_DEVICE_COOKIE_PREFIX}${roomCode.toLowerCase()}`;
}

export function createTeamDeviceToken(): string {
  return crypto.randomUUID();
}

export function normalizeTeamDeviceToken(token: string | null | undefined): string | null {
  const trimmed = token?.trim();
  if (!trimmed || trimmed.length > 128) {
    return null;
  }

  return trimmed;
}
