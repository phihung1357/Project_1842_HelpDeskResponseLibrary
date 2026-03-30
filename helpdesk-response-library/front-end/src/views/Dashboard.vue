<template>
  <section>
    <div class="ui stackable grid">
      <div class="ten wide column">
        <div class="ui segment panel-card dashboard-banner">
          <p class="eyebrow">Operations Overview</p>
          <h2 class="ui header">Support teams can monitor the response library at a glance.</h2>
          <p class="muted-copy">
            This dashboard surfaces live workload signals, urgent response items,
            and recent content updates so supervisors can manage the helpdesk
            library more confidently.
          </p>

          <div class="ui buttons dashboard-actions">
            <router-link class="ui button" to="/entries">
              Open Response Library
            </router-link>
            <div v-if="isAdminUser" class="or"></div>
            <router-link
              v-if="isAdminUser"
              class="ui primary button"
              to="/entries/new"
            >
              Add New Entry
            </router-link>
          </div>
        </div>
      </div>

      <div class="six wide column">
        <div class="ui segment panel-card dashboard-highlight">
          <div class="dashboard-highlight__header">
            <span class="status-pill status-active">Library Health</span>
          </div>
          <h3 class="ui header">{{ healthHeadline }}</h3>
          <p class="muted-copy">{{ healthSummary }}</p>

          <div class="ui relaxed list dashboard-health-list">
            <div class="item">
              <i class="check circle outline icon"></i>
              <div class="content">{{ activeEntries.length }} active staff responses</div>
            </div>
            <div class="item">
              <i class="archive icon"></i>
              <div class="content">{{ archivedEntries.length }} archived records kept for audit</div>
            </div>
            <div class="item">
              <i class="graduation cap icon"></i>
              <div class="content">{{ quizReady ? "Quiz ready for staff training" : "Add more active entries to unlock the quiz" }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ui four stackable cards dashboard-metrics">
      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Active Entries</div>
          <div class="description">
            <h2 class="ui header">{{ activeEntries.length }}</h2>
            <p class="muted-copy">Responses available to staff right now.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Critical Active</div>
          <div class="description">
            <h2 class="ui header">{{ criticalActiveEntries.length }}</h2>
            <p class="muted-copy">Entries needing the fastest attention.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Departments</div>
          <div class="description">
            <h2 class="ui header">{{ departmentSnapshot.length }}</h2>
            <p class="muted-copy">Teams currently covered by the library.</p>
          </div>
        </div>
      </div>

      <div class="ui fluid card metric-card panel-card">
        <div class="content">
          <div class="header">Recent Updates</div>
          <div class="description">
            <h2 class="ui header">{{ recentActivity.length }}</h2>
            <p class="muted-copy">Most recently touched records.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="ui stackable grid" style="margin-top: 0.4rem;">
      <div class="nine wide column">
        <div class="ui segment panel-card">
          <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
            <h3 class="ui left floated header">Urgent Queue</h3>
            <router-link class="ui right floated basic button" to="/entries">
              Manage Queue
            </router-link>
          </div>

          <div v-if="isLoading" class="ui active inverted dimmer">
            <div class="ui text loader">Loading urgent items</div>
          </div>

          <div v-else-if="!urgentQueue.length" class="ui placeholder segment">
            <div class="ui icon header">
              <i class="thumbs up outline icon"></i>
              No high-priority active items need attention right now.
            </div>
          </div>

          <div v-else class="ui relaxed divided items">
            <div
              v-for="entry in urgentQueue"
              :key="entry._id"
              class="item dashboard-item"
            >
              <div class="content">
                <div class="header">
                  {{ entry.issueCode }}
                  <span :class="['priority-pill', priorityClass(entry.priority)]">
                    {{ priorityText(entry.priority) }}
                  </span>
                </div>
                <div class="meta">
                  <span>{{ entry.department }}</span>
                  <span>Updated {{ formatDate(entry.updatedAt) }}</span>
                </div>
                <div class="description response-text dashboard-response">
                  {{ entry.responseText }}
                </div>
                <div class="extra">
                  <router-link
                    :to="`/entries/${entry._id}`"
                    class="ui tiny button"
                  >
                    View
                  </router-link>
                  <button
                    class="ui tiny basic button"
                    @click="copyIssueCode(entry)"
                  >
                    Copy Code
                  </button>
                  <button
                    class="ui tiny basic button"
                    @click="copyResponse(entry)"
                  >
                    Copy Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="seven wide column">
        <div class="ui segment panel-card">
          <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
            <h3 class="ui left floated header">Recent Activity</h3>
            <router-link class="ui right floated basic button" to="/entries">
              View All Entries
            </router-link>
          </div>

          <div v-if="isLoading" class="ui active inverted dimmer">
            <div class="ui text loader">Loading activity</div>
          </div>

          <div v-else-if="!recentActivity.length" class="ui placeholder segment">
            <div class="ui icon header">
              <i class="clock outline icon"></i>
              No recent activity yet.
            </div>
          </div>

          <div v-else class="dashboard-timeline">
            <div
              v-for="entry in recentActivity"
              :key="`activity-${entry._id}`"
              class="dashboard-timeline__item"
            >
              <div class="dashboard-timeline__marker"></div>
              <div class="dashboard-timeline__content">
                <div class="dashboard-timeline__topline">
                  <strong>{{ entry.issueCode }}</strong>
                  <span :class="['status-pill', statusClass(entry)]">
                    {{ statusText(entry) }}
                  </span>
                </div>
                <div class="muted-copy">
                  {{ entry.department }} · {{ priorityText(entry.priority) }} · {{ formatDate(entry.updatedAt) }}
                </div>
                <router-link :to="`/entries/${entry._id}`" class="dashboard-inline-link">
                  Open entry
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ui stackable grid" style="margin-top: 0.2rem;">
      <div class="eight wide column">
        <div class="ui segment panel-card">
          <h3 class="ui header">Department Snapshot</h3>
          <p class="muted-copy">
            Active and archived response counts by department help identify where
            the library is strongest and where it may need more coverage.
          </p>

          <table v-if="departmentSnapshot.length" class="ui compact celled table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Active</th>
                <th>Archived</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="department in departmentSnapshot"
                :key="department.name"
              >
                <td>{{ department.name }}</td>
                <td>{{ department.active }}</td>
                <td>{{ department.archived }}</td>
              </tr>
            </tbody>
          </table>

          <div v-else class="ui placeholder segment">
            <div class="ui icon header">
              <i class="sitemap icon"></i>
              Department metrics will appear when entries are available.
            </div>
          </div>
        </div>
      </div>

      <div class="eight wide column">
        <div class="ui segment panel-card">
          <h3 class="ui header">Operational Notes</h3>
          <div class="ui relaxed list dashboard-note-list">
            <div class="item">
              <i class="lightbulb outline icon"></i>
              <div class="content">
                Copy actions now let staff reuse approved wording without manual retyping.
              </div>
            </div>
            <div class="item">
              <i class="shield alternate icon"></i>
              <div class="content">
                Archive and restore keep a safer audit trail than permanent deletion.
              </div>
            </div>
            <div class="item">
              <i class="sort amount down icon"></i>
              <div class="content">
                Priority sorting and urgent queue views surface the most important issues first.
              </div>
            </div>
            <div class="item">
              <i class="book icon"></i>
              <div class="content">
                The staff quiz still works as a training feature and only uses active entries.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import {
  api,
  copyTextToClipboard,
  isAdmin,
  priorityOrder,
} from "../helpers/helpers";

export default {
  name: "DashboardView",
  data() {
    return {
      entries: [],
      isLoading: false,
    };
  },
  computed: {
    activeEntries() {
      return this.entries.filter((entry) => !entry.isArchived);
    },
    archivedEntries() {
      return this.entries.filter((entry) => entry.isArchived);
    },
    criticalActiveEntries() {
      return this.activeEntries.filter(
        (entry) => this.priorityText(entry.priority) === "Critical"
      );
    },
    urgentQueue() {
      return [...this.activeEntries]
        .filter((entry) =>
          ["High", "Critical"].includes(this.priorityText(entry.priority))
        )
        .sort((left, right) => {
          const priorityDiff =
            this.priorityRank(right.priority) - this.priorityRank(left.priority);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        })
        .slice(0, 5);
    },
    recentActivity() {
      return [...this.entries]
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        )
        .slice(0, 6);
    },
    departmentSnapshot() {
      const groups = new Map();

      for (const entry of this.entries) {
        if (!groups.has(entry.department)) {
          groups.set(entry.department, {
            name: entry.department,
            active: 0,
            archived: 0,
          });
        }

        const group = groups.get(entry.department);

        if (entry.isArchived) {
          group.archived += 1;
        } else {
          group.active += 1;
        }
      }

      return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
    },
    quizReady() {
      return this.activeEntries.length >= 4;
    },
    isAdminUser() {
      return isAdmin();
    },
    healthHeadline() {
      if (!this.activeEntries.length) {
        return "The library needs its first active responses.";
      }

      if (this.criticalActiveEntries.length >= 3) {
        return "Critical workload is building up.";
      }

      if (this.archivedEntries.length > this.activeEntries.length) {
        return "Most records are archived right now.";
      }

      return "The response library is in a healthy state.";
    },
    healthSummary() {
      if (!this.activeEntries.length) {
        return "Create a few approved helpdesk responses so staff and the quiz module both have content to work with.";
      }

      if (this.criticalActiveEntries.length >= 3) {
        return "Supervisors should review the critical queue and confirm the wording is still current for the support team.";
      }

      if (this.archivedEntries.length > this.activeEntries.length) {
        return "Consider restoring key entries or adding fresh responses so the active library stays useful in daily operations.";
      }

      return "Active coverage, archive safety, and training readiness are all in a solid place for demonstration.";
    },
  },
  async mounted() {
    await this.fetchEntries();
  },
  methods: {
    async fetchEntries() {
      this.isLoading = true;

      try {
        this.entries = (await api.getEntries()) || [];
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
    formatDate(value) {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
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
  },
};
</script>
