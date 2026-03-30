<template>
  <form class="ui form" @submit.prevent="onSubmit">
    <div class="field" :class="{ error: showFieldError('issueCode') }">
      <label>Issue Code</label>
      <input
        v-model="localEntry.issueCode"
        type="text"
        placeholder="Example: PWD_RESET"
        @blur="touchField('issueCode')"
      />
      <small class="muted-copy">
        Use uppercase issue codes with underscores so staff can recognise them
        quickly.
      </small>
      <div v-if="showFieldError('issueCode')" class="field-error-message">
        {{ fieldErrors.issueCode }}
      </div>
    </div>

    <div class="field" :class="{ error: showFieldError('department') }">
      <label>Department</label>
      <input
        v-model="localEntry.department"
        type="text"
        placeholder="Example: IT Support"
        @blur="touchField('department')"
      />
      <div v-if="showFieldError('department')" class="field-error-message">
        {{ fieldErrors.department }}
      </div>
    </div>

    <div class="field" :class="{ error: showFieldError('priority') }">
      <label>Priority</label>
      <select
        v-model="localEntry.priority"
        class="ui fluid dropdown"
        @blur="touchField('priority')"
      >
        <option
          v-for="priority in priorityOptions"
          :key="priority"
          :value="priority"
        >
          {{ priority }}
        </option>
      </select>
      <div v-if="showFieldError('priority')" class="field-error-message">
        {{ fieldErrors.priority }}
      </div>
    </div>

    <div class="field" :class="{ error: showFieldError('responseText') }">
      <label>Standard Response</label>
      <textarea
        v-model="localEntry.responseText"
        rows="5"
        placeholder="Write the approved helpdesk response that staff should use."
        @blur="touchField('responseText')"
      ></textarea>
      <div v-if="showFieldError('responseText')" class="field-error-message">
        {{ fieldErrors.responseText }}
      </div>
    </div>

    <div class="field" :class="{ error: showFieldError('tags') }">
      <label>Tags</label>
      <input
        v-model="localEntry.tagsText"
        type="text"
        placeholder="Example: password, account, onboarding"
        @blur="touchField('tags')"
      />
      <small class="muted-copy">
        Optional. Use short comma-separated tags to help search and grouping.
      </small>
      <div v-if="showFieldError('tags')" class="field-error-message">
        {{ fieldErrors.tags }}
      </div>
    </div>

    <div class="field" :class="{ error: showFieldError('notes') }">
      <label>Internal Notes</label>
      <textarea
        v-model="localEntry.notes"
        rows="3"
        placeholder="Optional staff-only context, escalation reminders, or usage guidance."
        @blur="touchField('notes')"
      ></textarea>
      <div v-if="showFieldError('notes')" class="field-error-message">
        {{ fieldErrors.notes }}
      </div>
    </div>

    <div v-if="errorsPresent" class="ui negative message">
      <div class="header">Please complete the required fields correctly.</div>
      <p>
        The response should be at least 10 characters, the issue code should
        only use letters, numbers, and underscores, the priority must be a
        valid option, and notes should stay concise.
      </p>
    </div>

    <button class="ui primary button" type="submit" :class="{ loading: isSaving }">
      {{ submitLabel }}
    </button>
  </form>
</template>

<script>
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export default {
  name: "EntryForm",
  props: {
    entry: {
      type: Object,
      default: () => ({}),
    },
    submitLabel: {
      type: String,
      default: "Save Entry",
    },
    isSaving: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      errorsPresent: false,
      submitAttempted: false,
      priorityOptions: PRIORITY_OPTIONS,
      touchedFields: {
        issueCode: false,
        department: false,
        priority: false,
        responseText: false,
        tags: false,
        notes: false,
      },
      localEntry: {
        issueCode: "",
        department: "",
        priority: "Medium",
        responseText: "",
        tagsText: "",
        notes: "",
      },
    };
  },
  computed: {
    fieldErrors() {
      const issueCode = this.localEntry.issueCode.trim().toUpperCase().replace(/\s+/g, "_");
      const department = this.localEntry.department.trim();
      const responseText = this.localEntry.responseText.trim();
      const tags = this.localEntry.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const notes = this.localEntry.notes.trim();

      return {
        issueCode: !issueCode
          ? "Issue code is required."
          : !/^[A-Z0-9_]+$/.test(issueCode)
            ? "Only letters, numbers, and underscores are allowed."
            : "",
        department: !department ? "Department is required." : "",
        priority: !PRIORITY_OPTIONS.includes(this.localEntry.priority)
          ? "Please choose a valid priority."
          : "",
        responseText: !responseText
          ? "Standard response is required."
          : responseText.length < 10
            ? "Standard response must be at least 10 characters."
            : "",
        tags: tags.length > 8 ? "Please use 8 tags or fewer." : "",
        notes: notes.length > 280 ? "Notes must be 280 characters or fewer." : "",
      };
    },
  },
  watch: {
    entry: {
      immediate: true,
      deep: true,
      handler(value) {
        this.localEntry = {
          issueCode: value.issueCode || "",
          department: value.department || "",
          priority: value.priority || "Medium",
          responseText: value.responseText || "",
          tagsText: Array.isArray(value.tags) ? value.tags.join(", ") : "",
          notes: value.notes || "",
        };
        this.submitAttempted = false;
        this.touchedFields = {
          issueCode: false,
          department: false,
          priority: false,
          responseText: false,
          tags: false,
          notes: false,
        };
      },
    },
  },
  methods: {
    touchField(fieldName) {
      this.$set(this.touchedFields, fieldName, true);
    },
    showFieldError(fieldName) {
      return (
        !!this.fieldErrors[fieldName] &&
        (this.submitAttempted || this.touchedFields[fieldName])
      );
    },
    onSubmit() {
      const payload = {
        issueCode: this.localEntry.issueCode.trim().toUpperCase().replace(/\s+/g, "_"),
        department: this.localEntry.department.trim(),
        priority: this.localEntry.priority,
        responseText: this.localEntry.responseText.trim(),
        tags: this.localEntry.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: this.localEntry.notes.trim(),
      };

      this.submitAttempted = true;
      Object.keys(this.touchedFields).forEach((fieldName) => {
        this.touchField(fieldName);
      });
      this.errorsPresent = Object.values(this.fieldErrors).some(Boolean);

      if (this.errorsPresent) {
        return;
      }

      this.$emit("createOrUpdate", payload);
    },
  },
};
</script>

<style scoped>
.field-error-message {
  margin-top: 0.45rem;
  color: #b42318;
  font-size: 0.92rem;
  font-weight: 600;
}
</style>
