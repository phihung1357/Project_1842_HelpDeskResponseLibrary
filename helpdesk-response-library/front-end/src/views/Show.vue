<template>
  <section class="ui segment panel-card">
    <div v-if="isLoading" class="ui active inverted dimmer">
      <div class="ui text loader">Loading entry</div>
    </div>

    <div v-else-if="!entry">
      <div class="ui negative message">
        <div class="header">Entry not found</div>
        <p>The selected helpdesk entry could not be loaded.</p>
      </div>
    </div>

    <div v-else>
      <div class="ui clearing basic segment" style="padding: 0;">
        <h2 class="ui left floated header">
          {{ entry.issueCode }}
          <div class="sub header">
            {{ entry.department }}
            <span :class="['status-pill', statusClass(entry)]">
              {{ statusText(entry) }}
            </span>
            <span :class="['priority-pill', priorityClass(entry.priority)]">
              {{ priorityText(entry.priority) }}
            </span>
          </div>
        </h2>

        <div class="ui right floated buttons">
          <router-link class="ui button" to="/entries">Back</router-link>
          <button class="ui button" @click="copyIssueCode">Copy Code</button>
          <button class="ui button" @click="copyResponse">Copy Response</button>
          <router-link
            v-if="isAdminUser && !entry.isArchived"
            :to="`/entries/${entry._id}/edit`"
            class="ui teal button"
          >
            Edit
          </router-link>
          <button
            v-if="isAdminUser && !entry.isArchived"
            class="ui orange button"
            @click="archiveEntry"
          >
            Archive
          </button>
          <button
            v-else-if="isAdminUser"
            class="ui green button"
            @click="restoreEntry"
          >
            Restore
          </button>
        </div>
      </div>

      <div class="ui divider"></div>

      <div class="ui relaxed list">
        <div class="item">
          <div class="header">Status</div>
          <div class="description">
            <span :class="['status-pill', statusClass(entry)]">
              {{ statusText(entry) }}
            </span>
          </div>
        </div>
        <div class="item">
          <div class="header">Priority</div>
          <div class="description">
            <span :class="['priority-pill', priorityClass(entry.priority)]">
              {{ priorityText(entry.priority) }}
            </span>
          </div>
        </div>
        <div class="item">
          <div class="header">Standard Response</div>
          <div class="description response-text">{{ entry.responseText }}</div>
        </div>
        <div v-if="entry.tags && entry.tags.length" class="item">
          <div class="header">Tags</div>
          <div class="description detail-tag-list">
            <span
              v-for="tag in entry.tags"
              :key="`${entry._id}-${tag}`"
              class="entry-tag"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
        <div v-if="entry.notes" class="item">
          <div class="header">Internal Notes</div>
          <div class="description response-text">{{ entry.notes }}</div>
        </div>
        <div class="item">
          <div class="header">Created</div>
          <div class="description">{{ formatDate(entry.createdAt) }}</div>
        </div>
        <div class="item">
          <div class="header">Last Updated</div>
          <div class="description">{{ formatDate(entry.updatedAt) }}</div>
        </div>
        <div v-if="entry.archivedAt" class="item">
          <div class="header">Archived At</div>
          <div class="description">{{ formatDate(entry.archivedAt) }}</div>
        </div>
      </div>

      <div class="ui divider"></div>

      <div>
        <h3 class="ui header">Audit History</h3>

        <div v-if="entry.auditLog && entry.auditLog.length" class="audit-log">
          <div
            v-for="(event, index) in orderedAuditLog"
            :key="`${event.timestamp}-${index}`"
            class="audit-log__item"
          >
            <div class="audit-log__header">
              <strong>{{ event.action }}</strong>
              <span class="entry-tag">{{ event.actor }}</span>
              <span class="muted-copy">{{ formatDate(event.timestamp) }}</span>
            </div>
            <div class="response-text">{{ event.summary }}</div>
            <div
              v-if="event.changedFields && event.changedFields.length"
              class="muted-copy"
            >
              Fields: {{ event.changedFields.join(", ") }}
            </div>
          </div>
        </div>

        <div v-else class="ui placeholder segment">
          <div class="ui icon header">
            <i class="history icon"></i>
            Audit events will appear after entries are created, edited, archived, or restored.
          </div>
        </div>
      </div>
    </div>

    <ConfirmationModal
      :open="showArchiveModal"
      eyebrow="Archive Entry"
      title="Archive this helpdesk response?"
      message="The entry will be moved out of the active library, but you can restore it later from the archive workflow."
      confirm-label="Archive Entry"
      @cancel="closeArchiveModal"
      @confirm="confirmArchiveEntry"
    />
  </section>
</template>

<script>
import ConfirmationModal from "../components/ConfirmationModal.vue";
import { api, copyTextToClipboard, isAdmin } from "../helpers/helpers";

export default {
  name: "ShowEntryView",
  components: {
    ConfirmationModal,
  },
  data() {
    return {
      entry: null,
      isLoading: false,
      showArchiveModal: false,
    };
  },
  computed: {
    isAdminUser() {
      return isAdmin();
    },
    orderedAuditLog() {
      return [...((this.entry && this.entry.auditLog) || [])].sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );
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
    formatDate(value) {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    },
    priorityText(priority) {
      return priority || "Medium";
    },
    priorityClass(priority) {
      return `priority-${this.priorityText(priority).toLowerCase()}`;
    },
    statusText(entry) {
      return entry && entry.isArchived ? "Archived" : "Active";
    },
    statusClass(entry) {
      return entry && entry.isArchived ? "status-archived" : "status-active";
    },
    async copyIssueCode() {
      await copyTextToClipboard(
        this.entry && this.entry.issueCode,
        `Copied ${this.entry.issueCode} to the clipboard.`
      );
    },
    async copyResponse() {
      await copyTextToClipboard(
        this.entry && this.entry.responseText,
        `Copied the standard response for ${this.entry.issueCode}.`
      );
    },
    archiveEntry() {
      this.showArchiveModal = true;
    },
    closeArchiveModal() {
      this.showArchiveModal = false;
    },
    async confirmArchiveEntry() {
      try {
        const response = await api.archiveEntry(this.entry._id);
        this.entry = response.entry;
        this.closeArchiveModal();
        this.flash("Entry archived successfully.", "success", {
          timeout: 2500,
        });
      } catch (error) {
        // Errors are already surfaced via flash messages in the API helper.
      }
    },
    async restoreEntry() {
      try {
        const response = await api.restoreEntry(this.entry._id);
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
