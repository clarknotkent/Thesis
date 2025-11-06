function getActorId(req) {
  if (!req) return null;
  if (req.user) {
    if (req.user.user_id) return req.user.user_id;
    if (req.user.id) return req.user.id;
  }
  if (req.tokenPayload) {
    if (req.tokenPayload.user_id) return req.tokenPayload.user_id;
    if (req.tokenPayload.id) return req.tokenPayload.id;
  }
  return null;
}

export { getActorId };
