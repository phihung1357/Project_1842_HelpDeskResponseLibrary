<template>
  <section class="ui segment panel-card auth-card">
    <div class="ui stackable two column grid">
      <div class="column">
        <p class="eyebrow">Secure Access</p>
        <h2 class="ui header">Sign in to the Helpdesk Response Library</h2>
        <p class="muted-copy">
          This lightweight role-based login keeps management actions separate
          from staff-only access. Admin users can maintain the response library,
          while staff users can browse, search, export, and complete quizzes.
        </p>

        <div class="ui relaxed list">
          <div class="item">
            <i class="shield alternate icon"></i>
            <div class="content">
              Admin access is reserved for creating, updating, archiving, and
              restoring entries.
            </div>
          </div>
          <div class="item">
            <i class="users icon"></i>
            <div class="content">
              Staff access focuses on safe day-to-day use of the knowledge base.
            </div>
          </div>
          <div class="item">
            <i class="lock icon"></i>
            <div class="content">
              Credentials are no longer displayed on the login screen.
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <form class="ui form" @submit.prevent="submitLogin">
          <div class="field">
            <label>Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="Enter your username"
              autocomplete="username"
            />
          </div>

          <div class="field">
            <label>Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
            />
          </div>

          <button class="ui primary button" type="submit">
            Sign In
          </button>
          <router-link class="ui basic button" to="/register">
            Create Account
          </router-link>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
import { loginUser } from "../helpers/helpers";

export default {
  name: "LoginView",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    async submitLogin() {
      const session = await loginUser(this.username, this.password);

      if (!session) {
        return;
      }

      this.$router.push(this.$route.query.redirect || "/");
    },
  },
};
</script>
