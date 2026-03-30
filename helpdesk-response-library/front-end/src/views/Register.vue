<template>
  <section class="ui segment panel-card auth-card">
    <div class="ui stackable two column grid">
      <div class="column">
        <p class="eyebrow">Create Account</p>
        <h2 class="ui header">Register a new staff account</h2>
        <p class="muted-copy">
          New accounts are created with the default <strong>Staff</strong> role.
          Admin permissions remain restricted to administrator-managed accounts.
        </p>

        <div class="ui relaxed list">
          <div class="item">
            <i class="user plus icon"></i>
            <div class="content">
              Choose a unique username using lowercase letters, numbers, and underscores.
            </div>
          </div>
          <div class="item">
            <i class="id badge outline icon"></i>
            <div class="content">
              Add a display name so audit history and team activity remain readable.
            </div>
          </div>
          <div class="item">
            <i class="key icon"></i>
            <div class="content">
              Passwords must include uppercase, lowercase, and numeric characters.
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <form class="ui form" @submit.prevent="submitRegister">
          <div class="field">
            <label>Display Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Enter your display name"
              autocomplete="name"
            />
          </div>

          <div class="field">
            <label>Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="Choose a username"
              autocomplete="username"
            />
          </div>

          <div class="field">
            <label>Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Create a password"
              autocomplete="new-password"
            />
          </div>

          <div class="field">
            <label>Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              autocomplete="new-password"
            />
          </div>

          <button class="ui primary button" type="submit">
            Register
          </button>
          <router-link class="ui basic button" to="/login">
            Back to Login
          </router-link>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
import { registerUser } from "../helpers/helpers";

export default {
  name: "RegisterView",
  data() {
    return {
      confirmPassword: "",
      displayName: "",
      password: "",
      username: "",
    };
  },
  methods: {
    async submitRegister() {
      const session = await registerUser({
        displayName: this.displayName,
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword,
      });

      if (!session) {
        return;
      }

      this.$router.push("/");
    },
  },
};
</script>
