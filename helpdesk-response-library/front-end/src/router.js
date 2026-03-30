import Vue from "vue";
import Router from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Entries from "./views/Entries.vue";
import NewEntry from "./views/New.vue";
import Show from "./views/Show.vue";
import Edit from "./views/Edit.vue";
import Test from "./views/Test.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import { getSession } from "./helpers/helpers";

Vue.use(Router);

const router = new Router({
  mode: "history",
  linkActiveClass: "active",
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: {
        public: true,
      },
    },
    {
      path: "/register",
      name: "register",
      component: Register,
      meta: {
        public: true,
      },
    },
    {
      path: "/",
      name: "dashboard",
      component: Dashboard,
    },
    {
      path: "/dashboard",
      redirect: "/",
    },
    {
      path: "/entries",
      name: "entries",
      component: Entries,
    },
    {
      path: "/entries/new",
      name: "new-entry",
      component: NewEntry,
      meta: {
        adminOnly: true,
      },
    },
    {
      path: "/entries/:id",
      name: "show-entry",
      component: Show,
    },
    {
      path: "/entries/:id/edit",
      name: "edit-entry",
      component: Edit,
      meta: {
        adminOnly: true,
      },
    },
    {
      path: "/test",
      name: "test",
      component: Test,
    },
  ],
});

router.beforeEach((to, from, next) => {
  const session = getSession();

  if (to.meta && to.meta.public) {
    if (session && (to.path === "/login" || to.path === "/register")) {
      return next("/");
    }

    return next();
  }

  if (!session) {
    return next({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (to.meta && to.meta.adminOnly && session.user.role !== "Admin") {
    return next("/");
  }

  return next();
});

export default router;
