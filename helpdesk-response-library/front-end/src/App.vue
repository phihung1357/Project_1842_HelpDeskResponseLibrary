<template>
  <div id="app">
    <div class="hero">
      <div class="ui container">
        <div class="hero__panel">
          <div class="hero__content">
            <h1>Helpdesk Response Library</h1>
            <p class="hero__copy">
              A staff-facing knowledge system for storing issue codes, approved
              responses, audit history, and operational priorities across the
              helpdesk team.
            </p>
          </div>

          <div class="hero__topbar">
            <div class="ui secondary stackable pointing menu app-menu">
              <router-link class="item" to="/" exact>
                Dashboard
              </router-link>
              <router-link class="item" to="/entries" exact>
                Response Entries
              </router-link>
              <router-link v-if="isAdminUser" class="item" to="/entries/new">
                Add New Entry
              </router-link>
              <router-link class="item" to="/test">
                Staff Quiz
              </router-link>
            </div>

            <div v-if="session" class="session-panel">
              <span class="role-pill">{{ session.user.role }}</span>
              <div class="session-panel__meta">
                <strong>{{ session.user.displayName }}</strong>
                <span>{{ session.user.username }}</span>
              </div>
              <button class="ui basic button" @click="logout">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <flash-message position="right top"></flash-message>

    <main class="page-shell">
      <div class="ui container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import {
  getSession,
  isAdmin,
  logoutUser,
  restoreSession,
} from "./helpers/helpers";

export default {
  name: "App",
  data() {
    return {
      session: getSession(),
    };
  },
  computed: {
    isAdminUser() {
      return isAdmin();
    },
  },
  mounted() {
    window.addEventListener("helpdesk-auth-changed", this.refreshSession);
    restoreSession().then((session) => {
      if (session) {
        this.session = session;
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener("helpdesk-auth-changed", this.refreshSession);
  },
  methods: {
    refreshSession() {
      this.session = getSession();
    },
    async logout() {
      await logoutUser();
      this.$router.push("/login");
      this.refreshSession();
    },
  },
};
</script>
