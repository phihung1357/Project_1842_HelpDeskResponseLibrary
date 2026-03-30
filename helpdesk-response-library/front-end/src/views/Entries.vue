<template>
  <section>
    <div class="ui four stackable cards">
      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Active Entries</div>
          <div class="description">
            <h2 class="ui header">{{ activeEntriesCount }}</h2>
            <p class="muted-copy">Responses currently available to staff.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Archived Entries</div>
          <div class="description">
            <h2 class="ui header">{{ archivedEntriesCount }}</h2>
            <p class="muted-copy">Responses kept for audit and later recovery.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Departments Covered</div>
          <div class="description">
            <h2 class="ui header">{{ departments.length }}</h2>
            <p class="muted-copy">Different teams currently represented.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">High Priority Active</div>
          <div class="description">
            <h2 class="ui header">{{ highPriorityCount }}</h2>
            <p class="muted-copy">High or critical items still active in the library.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="ui segment panel-card" style="margin-top: 1.5rem;">
      <div class="ui stackable grid">
        <div class="five wide column">
          <div class="ui icon input fluid">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search by code, status, priority, department, response, tag, or note"
            />
            <i class="search icon"></i>
          </div>
        </div>

        <div class="three wide column">
          <select v-model="selectedDepartment" class="ui fluid dropdown">
            <option value="">All departments</option>
            <option
              v-for="department in departments"
              :key="department"
              :value="department"
            >
              {{ department }}
            </option>
          </select>
        </div>

        <div class="two wide column">
          <select v-model="selectedStatus" class="ui fluid dropdown">
            <option
              v-for="status in statusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </select>
        </div>

        <div class="three wide column">
          <select v-model="selectedPriority" class="ui fluid dropdown">
            <option value="">All priorities</option>
            <option
              v-for="priority in priorityOptions"
              :key="priority"
              :value="priority"
            >
              {{ priority }}
            </option>
          </select>
        </div>

        <div class="three wide column">
          <select v-model="selectedSort" class="ui fluid dropdown">
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <p class="muted-copy" style="margin-top: 1rem;">
        Professional upgrade: staff can now archive entries instead of deleting
        them permanently, restore past responses, filter the library by live
        or archived status, and manage searchable tags and internal notes.
      </p>
    </div>

    <div class="ui segment panel-card" style="margin-top: 1.5rem;">
      <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
        <h2 class="ui left floated header">Response Entries</h2>
        <div class="ui right floated buttons">
          <button class="ui button" @click="exportJson">
            Export JSON
          </button>
          <button class="ui button" @click="exportCsv">
            Export CSV
          </button>
          <router-link
            v-if="isAdminUser"
            class="ui primary button"
            to="/entries/new"
          >
            Add Entry
          </router-link>
        </div>
      </div>

      <div v-if="!isLoading && filteredEntries.length" class="entries-toolbar">
        <div class="muted-copy">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredEntries.length }} matching entries.
        </div>
      </div>

      <div v-if="isLoading" class="ui active inverted dimmer">
        <div class="ui text loader">Loading entries</div>
      </div>

      <div v-else-if="!filteredEntries.length" class="ui placeholder segment">
        <div class="ui icon header">
          <i class="archive icon"></i>
          No entries match the current filters.
        </div>
      </div>

      <table v-else class="ui celled striped table">
        <thead>
          <tr>
            <th>Issue Code</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Department</th>
            <th>Standard Response</th>
            <th class="center aligned">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in paginatedEntries"
            :key="entry._id"
            :class="{ 'archived-row': entry.isArchived }"
          >
            <td>
              <div class="entry-cell">
                <strong>{{ entry.issueCode }}</strong>
                <button
                  class="ui tiny basic button table-copy-button"
                  @click.prevent="copyIssueCode(entry)"
                >
                  Copy Code
                </button>
              </div>
            </td>
            <td>
              <span :class="['status-pill', statusClass(entry)]">
                {{ statusText(entry) }}
              </span>
            </td>
            <td>
              <span :class="['priority-pill', priorityClass(entry.priority)]">
                {{ priorityText(entry.priority) }}
              </span>
            </td>
            <td>
              <div>{{ entry.department }}</div>
              <div v-if="entry.tags && entry.tags.length" class="entry-tag-list">
                <span
                  v-for="tag in entry.tags.slice(0, 3)"
                  :key="`${entry._id}-${tag}`"
                  class="entry-tag"
                >
                  #{{ tag }}
                </span>
              </div>
            </td>
            <td>
              <div>{{ truncate(entry.responseText) }}</div>
              <div v-if="entry.notes" class="muted-copy entry-note-preview">
                Note: {{ truncate(entry.notes, 70) }}
              </div>
              <button
                class="ui tiny basic button table-copy-button"
                @click.prevent="copyResponse(entry)"
              >
                Copy Response
              </button>
            </td>
            <td class="center aligned">
              <router-link
                :to="`/entries/${entry._id}`"
                class="ui tiny button"
              >
                View
              </router-link>
              <router-link
                v-if="isAdminUser && !entry.isArchived"
                :to="`/entries/${entry._id}/edit`"
                class="ui tiny teal button"
              >
                Edit
              </router-link>
              <button
                v-if="isAdminUser && !entry.isArchived"
                class="ui tiny orange button"
                @click.prevent="archiveEntry(entry)"
              >
                Archive
              </button>
              <button
                v-else-if="isAdminUser"
                class="ui tiny green button"
                @click.prevent="restoreEntry(entry)"
              >
                Restore
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="!isLoading && totalPages > 1"
        class="ui stackable middle aligned grid entries-pagination"
      >
        <div class="eight wide column">
          <div class="muted-copy">Page {{ currentPage }} of {{ totalPages }}</div>
        </div>

        <div class="eight wide right aligned column">
          <div class="ui buttons">
            <button
              class="ui button"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              Previous
            </button>
            <button
              v-for="page in pageNumbers"
              :key="page"
              class="ui button"
              :class="{ primary: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              class="ui button"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmationModal
      :open="showArchiveModal"
      eyebrow="Archive Entry"
      title="Archive this helpdesk response?"
      message="This response will be hidden from the active library and can be restored later if the team needs it again."
      confirm-label="Archive Entry"
      @cancel="closeArchiveModal"
      @confirm="confirmArchiveEntry"
    />
  </section>
</template>

<script>
import ConfirmationModal from "../components/ConfirmationModal.vue";
import {
  api,
  copyTextToClipboard,
  exportEntriesAsCsv,
  exportEntriesAsJson,
  isAdmin,
  priorityOptions,
  priorityOrder,
} from "../helpers/helpers";

export default {
  name: "EntriesView",
  components: {
    ConfirmationModal,
  },
  data() {
    return {
      entries: [],
      isLoading: false,
      pendingArchiveEntry: null,
      searchTerm: "",
      showArchiveModal: false,
      selectedDepartment: "",
      selectedStatus: "active",
      selectedPriority: "",
      selectedSort: "priority-desc",
      currentPage: 1,
      pageSize: 10,
      priorityOptions,
      statusOptions: [
        { label: "Active Only", value: "active" },
        { label: "Archived Only", value: "archived" },
        { label: "All Statuses", value: "all" },
      ],
      sortOptions: [
        { label: "Sort: Highest Priority", value: "priority-desc" },
        { label: "Sort: Lowest Priority", value: "priority-asc" },
        { label: "Sort: Recently Updated", value: "updated-desc" },
        { label: "Sort: Issue Code A-Z", value: "issueCode-asc" },
        { label: "Sort: Department A-Z", value: "department-asc" },
      ],
    };
  },
  computed: {
    activeEntriesCount() {
      return this.entries.filter((entry) => !entry.isArchived).length;
    },
    archivedEntriesCount() {
      return this.entries.filter((entry) => entry.isArchived).length;
    },
    departments() {
      return [...new Set(this.entries.map((entry) => entry.department))].sort();
    },
    highPriorityCount() {
      return this.entries.filter(
        (entry) =>
          !entry.isArchived &&
          ["High", "Critical"].includes(this.priorityText(entry.priority))
      ).length;
    },
    isAdminUser() {
      return isAdmin();
    },
    filteredEntries() {
      const search = this.searchTerm.trim().toLowerCase();

      return [...this.entries]
        .filter((entry) => {
          const priority = this.priorityText(entry.priority);
          const status = this.statusText(entry).toLowerCase();
          const matchesDepartment =
            !this.selectedDepartment || entry.department === this.selectedDepartment;
          const matchesPriority =
            !this.selectedPriority || priority === this.selectedPriority;
          const matchesStatus =
            this.selectedStatus === "all" ||
            (this.selectedStatus === "active" && !entry.isArchived) ||
            (this.selectedStatus === "archived" && entry.isArchived);

          if (!search) {
            return matchesDepartment && matchesPriority && matchesStatus;
          }

          const haystack = [
            entry.issueCode,
            entry.department,
            priority,
            status,
            entry.responseText,
            entry.notes || "",
            ...(entry.tags || []),
          ]
            .join(" ")
            .toLowerCase();

          return (
            matchesDepartment &&
            matchesPriority &&
            matchesStatus &&
            haystack.includes(search)
          );
        })
        .sort((left, right) => this.compareEntries(left, right));
    },
    paginatedEntries() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredEntries.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredEntries.length / this.pageSize));
    },
    pageNumbers() {
      const pages = [];

      for (let page = 1; page <= this.totalPages; page += 1) {
        pages.push(page);
      }

      return pages;
    },
    pageStart() {
      if (!this.filteredEntries.length) {
        return 0;
      }

      return (this.currentPage - 1) * this.pageSize + 1;
    },
    pageEnd() {
      return Math.min(this.currentPage * this.pageSize, this.filteredEntries.length);
    },
  },
  watch: {
    searchTerm() {
      this.currentPage = 1;
    },
    selectedDepartment() {
      this.currentPage = 1;
    },
    selectedStatus() {
      this.currentPage = 1;
    },
    selectedPriority() {
      this.currentPage = 1;
    },
    selectedSort() {
      this.currentPage = 1;
    },
    totalPages(value) {
      if (this.currentPage > value) {
        this.currentPage = value;
      }
    },
  },
  async mounted() {
    await this.fetchEntries();
  },
  methods: {
    async fetchEntries() {
      this.isLoading = true;

      try {
        const entries = await api.getEntries();
        this.entries = entries || [];
      } catch (error) {
        this.entries = [];
      } finally {
        this.isLoading = false;
      }
    },
    priorityText(priority) {
      return priority || "Medium";
    },
    priorityClass(priority) {
      return `priority-${this.priorityText(priority).toLowerCase()}`;
    },
    priorityRank(priority) {
      return priorityOrder[this.priorityText(priority)] || 0;
    },
    statusText(entry) {
      return entry && entry.isArchived ? "Archived" : "Active";
    },
    statusClass(entry) {
      return entry && entry.isArchived ? "status-archived" : "status-active";
    },
    compareEntries(left, right) {
      const leftPriority = this.priorityRank(left.priority);
      const rightPriority = this.priorityRank(right.priority);

      switch (this.selectedSort) {
        case "priority-asc":
          return leftPriority - rightPriority || left.issueCode.localeCompare(right.issueCode);
        case "updated-desc":
          return (
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() ||
            left.issueCode.localeCompare(right.issueCode)
          );
        case "issueCode-asc":
          return left.issueCode.localeCompare(right.issueCode);
        case "department-asc":
          return (
            left.department.localeCompare(right.department) ||
            left.issueCode.localeCompare(right.issueCode)
          );
        case "priority-desc":
        default:
          return rightPriority - leftPriority || left.issueCode.localeCompare(right.issueCode);
      }
    },
    truncate(text, limit = 95) {
      if (!text) {
        return "";
      }

      return text.length > limit ? `${text.slice(0, limit)}...` : text;
    },
    goToPage(page) {
      if (page < 1 || page > this.totalPages) {
        return;
      }

      this.currentPage = page;
    },
    exportJson() {
      exportEntriesAsJson(this.filteredEntries);
    },
    exportCsv() {
      exportEntriesAsCsv(this.filteredEntries);
    },
    async copyIssueCode(entry) {
      await copyTextToClipboard(
        entry.issueCode,
        `Copied ${entry.issueCode} to the clipboard.`
      );
    },
    async copyResponse(entry) {
      await copyTextToClipboard(
        entry.responseText,
        `Copied the standard response for ${entry.issueCode}.`
      );
    },
    archiveEntry(entry) {
      this.pendingArchiveEntry = entry;
      this.showArchiveModal = true;
    },
    closeArchiveModal() {
      this.showArchiveModal = false;
      this.pendingArchiveEntry = null;
    },
    async confirmArchiveEntry() {
      if (!this.pendingArchiveEntry) {
        return;
      }

      try {
        const response = await api.archiveEntry(this.pendingArchiveEntry._id);
        this.entries = this.entries.map((item) =>
          item._id === this.pendingArchiveEntry._id ? response.entry : item
        );
        this.closeArchiveModal();
        this.flash("Entry archived successfully.", "success", {
          timeout: 2500,
        });
      } catch (error) {
        // Errors are already surfaced via flash messages in the API helper.
      }
    },
    async restoreEntry(entry) {
      try {
        const response = await api.restoreEntry(entry._id);
        this.entries = this.entries.map((item) =>
          item._id === entry._id ? response.entry : item
        );
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
