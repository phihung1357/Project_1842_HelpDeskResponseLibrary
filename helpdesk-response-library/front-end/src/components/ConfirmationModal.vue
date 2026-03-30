<template>
  <div v-if="open" class="confirm-modal">
    <div class="confirm-modal__backdrop" @click="$emit('cancel')"></div>

    <div
      class="confirm-modal__panel panel-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <p class="eyebrow">{{ eyebrow }}</p>
      <h3 :id="titleId" class="ui header confirm-modal__title">{{ title }}</h3>
      <p class="muted-copy confirm-modal__message">{{ message }}</p>

      <div class="confirm-modal__actions">
        <button class="ui button" @click="$emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button class="ui orange button" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ConfirmationModal",
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    eyebrow: {
      type: String,
      default: "Please Confirm",
    },
    title: {
      type: String,
      default: "Confirm Action",
    },
    message: {
      type: String,
      default: "",
    },
    confirmLabel: {
      type: String,
      default: "Confirm",
    },
    cancelLabel: {
      type: String,
      default: "Cancel",
    },
  },
  computed: {
    titleId() {
      return `confirm-modal-${this._uid}`;
    },
  },
};
</script>
