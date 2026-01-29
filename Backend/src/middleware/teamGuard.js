function enforceSameTeam(req, res, next) {
  const sessionUser = req.session?.user;
  if (!sessionUser) return res.status(401).json({ success: false, message: "Unauthorized" });

  // Admin puede ver todo
  if (sessionUser.role === "admin") return next();

  // Team requerido para engineer/driver
  const expected = sessionUser.teamId;
  if (!expected) return res.status(403).json({ success: false, message: "No team assigned" });

  // Sacar teamId desde params o body (depende del endpoint)
  const teamIdFromReq =
    req.params.teamId ??
    req.params.id ??
    req.body.teamId ??
    req.body.Team_id;

  if (!teamIdFromReq) return res.status(400).json({ success: false, message: "Team id required" });

  if (parseInt(teamIdFromReq) !== parseInt(expected)) {
    return res.status(403).json({ success: false, message: "Forbidden: wrong team" });
  }

  next();
}

module.exports = { enforceSameTeam };
