module.exports = (app) => {
  const helpdesk = require("../controllers/helpdeskController");
  const auth = require("../controllers/authController");

  app
    .route("/entries")
    .get(auth.require_auth, helpdesk.list_all_entries)
    .post(auth.require_auth, auth.require_admin, helpdesk.create_a_entry);

  app
    .route("/entries/:entryId")
    .get(auth.require_auth, helpdesk.read_a_entry)
    .put(auth.require_auth, auth.require_admin, helpdesk.update_a_entry)
    .delete(auth.require_auth, auth.require_admin, helpdesk.delete_a_entry);

  app
    .route("/entries/:entryId/restore")
    .put(auth.require_auth, auth.require_admin, helpdesk.restore_a_entry);
};
