let _pendingBase64: string | null = null;
let _pendingImageUri: string | null = null;

export function setPendingBase64(base64: string) {
  _pendingBase64 = base64;
}

export function consumePendingBase64(): string | null {
  const value = _pendingBase64;
  _pendingBase64 = null;
  return value;
}

export function setPendingImageUri(uri: string) {
  _pendingImageUri = uri;
}

export function getPendingImageUri(): string | null {
  return _pendingImageUri;
}

let _pendingSideImageUri: string | null = null;

export function setPendingSideImageUri(uri: string) {
  _pendingSideImageUri = uri;
}

export function getPendingSideImageUri(): string | null {
  return _pendingSideImageUri;
}

export function clearPendingSideImageUri() {
  _pendingSideImageUri = null;
}

let _pendingSideBase64: string | null = null;
export function setPendingSideBase64(base64: string) {
  _pendingSideBase64 = base64;
}
export function getPendingSideBase64(): string | null {
  return _pendingSideBase64;
}
