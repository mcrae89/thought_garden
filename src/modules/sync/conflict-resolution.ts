export function resolveConflict<T extends { last_modified_at: number }>(local: T, remote: T): T {
  return local.last_modified_at >= remote.last_modified_at ? local : remote;
}
