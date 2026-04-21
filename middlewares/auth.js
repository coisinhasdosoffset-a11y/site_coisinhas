function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
}

function checkAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.is_admin !== 1) {
    return res.redirect('/dashboard');
  }

  next();
}

function checkForcePasswordChange(req, res, next) {
  if (!req.session.user) {
    return next();
  }

  const allowedPaths = [
    '/force-password-change',
    '/logout'
  ];

  if (
    req.session.user.force_password_change === 1 &&
    !allowedPaths.includes(req.path)
  ) {
    return res.redirect('/force-password-change');
  }

  next();
}

module.exports = {
  checkAuth,
  checkAdmin,
  checkForcePasswordChange
};