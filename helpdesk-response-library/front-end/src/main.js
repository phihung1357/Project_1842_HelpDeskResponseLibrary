import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import "./helpers/helpers";
import "semantic-ui-css/semantic.min.css";
import "./assets/main.css";

Vue.config.productionTip = false;

new Vue({
  router,
  render: (createElement) => createElement(App),
}).$mount("#app");
