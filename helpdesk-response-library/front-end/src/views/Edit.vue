<template>
  <section class="ui segment panel-card">
    <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
      <h2 class="ui left floated header">Edit Helpdesk Entry</h2>
      <router-link class="ui right floated button" :to="backLink">
        Cancel
      </router-link>
    </div>

    <div v-if="isLoading" class="ui active inverted dimmer">
      <div class="ui text loader">Loading entry</div>
    </div>

    <div v-else-if="!entry">
      <div class="ui negative message">
        <div class="header">Entry not found</div>
        <p>The selected entry could not be loaded for editing.</p>
      </div>
    </div>

    <div v-else-if="entry.isArchived" class="ui warning message">
      <div class="header">This entry is currently archived</div>
      <p>
        Restore it before editing so the audit trail remains clear and staff do
        not accidentally update inactive responses.
      </p>
      <button class="ui green button" @click="restoreEntry">
        Restore Entry
      </button>
    </div>

    <EntryForm
      v-else
      :entry="entry"
      submit-label="Update Entry"
      :is-saving="isSaving"
      @createOrUpdate="updateEntry"
    />
  </section>
</template>

<script>
import EntryForm from "../components/EntryForm.vue";
import { api } from "../helpers/helpers";

export default {
  name: "EditEntryView",
  components: {
    EntryForm,
  },
  data() {
    return {
      entry: null,
      isLoading: false,
      isSaving: false,
    };
  },
  computed: {
    backLink() {
      return `/entries/${this.$route.params.id}`;
    },
  },
  async mounted() {
    await this.fetchEntry();
  },
  methods: {
    async fetchEntry() {
      this.isLoading = true;

      try {
        this.entry = await api.getEntry(this.$route.params.id);
      } catch (error) {
        this.entry = null;
      } finally {
        this.isLoading = false;
      }
    },
    async updateEntry(payload) {
      this.isSaving = true;

      try {
        const updatedEntry = await api.updateEntry(this.$route.params.id, payload);
        this.flash("Entry updated successfully.", "success", {
          timeout: 2500,
        });
        this.$router.push(`/entries/${updatedEntry._id}`);
      } catch (error) {
        // Errors are already surfaced via flash messages in the API helper.
      } finally {
        this.isSaving = false;
      }
    },
    async restoreEntry() {
      try {
        const response = await api.restoreEntry(this.$route.params.id);
        this.entry = response.entry;
        this.flash("Entry restored successfully.", "success", {
          timeout: 2500,
        });
      } catch (error) {
        // Errors are already surfaced via flash messages in the API helper.
      }
    },
  },
};
</script>
