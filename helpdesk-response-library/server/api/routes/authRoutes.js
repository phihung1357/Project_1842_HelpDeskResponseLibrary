module.exports = (app) => {
  const auth = require("../controllers/authController");

  app.route("/auth/register").post(auth.register);
  app.route("/auth/login").post(auth.login);
  app.route("/auth/me").get(auth.require_auth, auth.me);
  app.route("/auth/logout").post(auth.require_auth, auth.logout);
};
