<template>
  <section class="ui segment panel-card">
    <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
      <h2 class="ui left floated header">Add New Helpdesk Entry</h2>
      <router-link class="ui right floated button" to="/entries">
        Back to Entries
      </router-link>
    </div>

    <EntryForm
      :entry="entry"
      submit-label="Create Entry"
      :is-saving="isSaving"
      @createOrUpdate="createEntry"
    />
  </section>
</template>

<script>
import EntryForm from "../components/EntryForm.vue";
import { api } from "../helpers/helpers";

export default {
  name: "NewEntryView",
  components: {
    EntryForm,
  },
  data() {
    return {
      isSaving: false,
      entry: {
        issueCode: "",
        department: "",
        priority: "Medium",
        responseText: "",
        tags: [],
        notes: "",
      },
    };
  },
  methods: {
    async createEntry(payload) {
      this.isSaving = true;

      try {
        const createdEntry = await api.createEntry(payload);
        this.flash("Entry created successfully.", "success", {
          timeout: 2500,
        });
        this.$router.push(`/entries/${createdEntry._id}`);
      } catch (error) {
        // Errors are already surfaced via flash messages in the API helper.
      } finally {
        this.isSaving = false;
      }
    },
  },
};
</script>
