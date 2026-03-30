<template>
  <section class="ui segment panel-card">
    <div class="ui clearing basic segment" style="padding: 0 0 1rem;">
      <h2 class="ui left floated header">Staff Training Quiz</h2>
      <button class="ui right floated button" @click="restartQuiz" :disabled="!quizReady">
        Restart Quiz
      </button>
    </div>

    <p class="muted-copy">
      Match each helpdesk issue code to the correct approved response. This page
      directly supports the coursework extension requested in the brief.
    </p>

    <div v-if="isLoading" class="ui active inverted dimmer">
      <div class="ui text loader">Preparing quiz</div>
    </div>

    <div v-else-if="!quizReady" class="ui warning message">
      <div class="header">Add more entries to unlock the quiz</div>
      <p>
        You currently need at least four helpdesk entries before the system can
        build multiple-choice quiz questions.
      </p>
    </div>

    <div v-else-if="showResults" class="ui positive message">
      <div class="header">Quiz complete</div>
      <p>
        You scored {{ score }} out of {{ questions.length }}.
      </p>
      <button class="ui primary button" @click="restartQuiz">Try Again</button>
    </div>

    <div v-else-if="currentQuestion">
      <div class="ui top attached secondary segment">
        <strong>Question {{ currentIndex + 1 }}</strong>
        <span class="muted-copy">
          of {{ questions.length }} | Current score: {{ score }}
        </span>
      </div>

      <div class="ui attached segment">
        <p class="eyebrow" style="margin-bottom: 0.4rem;">Issue Code</p>
        <h3 class="ui header" style="margin-top: 0;">
          {{ currentQuestion.issueCode }}
          <div class="sub header">
            {{ currentQuestion.department }}
            <span :class="['priority-pill', priorityClass(currentQuestion.priority)]">
              {{ priorityText(currentQuestion.priority) }}
            </span>
          </div>
        </h3>

        <div class="ui relaxed divided items" style="margin-top: 1rem;">
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="`${currentQuestion.issueCode}-${index}`"
            class="item ui segment quiz-option"
            :class="optionClass(option)"
          >
            <div class="content">
              <div class="field">
                <input
                  :id="`quiz-option-${currentIndex}-${index}`"
                  v-model="selectedAnswer"
                  type="radio"
                  name="quiz-option"
                  :value="option"
                  :disabled="checked"
                />
                <label :for="`quiz-option-${currentIndex}-${index}`">{{ option }}</label>
              </div>
            </div>
          </div>
        </div>

        <div v-if="checked" class="ui info message" style="margin-top: 1rem;">
          <div class="header">Correct Response</div>
          <p>{{ currentQuestion.correctAnswer }}</p>
        </div>

        <div class="ui buttons" style="margin-top: 1rem;">
          <button class="ui primary button" @click="submitAnswer">
            Check Answer
          </button>
          <div class="or"></div>
          <button class="ui button" @click="nextQuestion">
            {{ currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { api } from "../helpers/helpers";

export default {
  name: "TestView",
  data() {
    return {
      entries: [],
      questions: [],
      currentIndex: 0,
      selectedAnswer: "",
      checked: false,
      score: 0,
      isLoading: false,
      showResults: false,
    };
  },
  computed: {
    quizReady() {
      return this.entries.length >= 4;
    },
    currentQuestion() {
      return this.questions[this.currentIndex] || null;
    },
  },
  async mounted() {
    await this.loadQuiz();
  },
  methods: {
    async loadQuiz() {
      this.isLoading = true;

      try {
        this.entries = ((await api.getEntries()) || []).filter(
          (entry) => !entry.isArchived
        );
        this.prepareQuestions();
      } catch (error) {
        this.entries = [];
        this.questions = [];
      } finally {
        this.isLoading = false;
      }
    },
    prepareQuestions() {
      if (!this.quizReady) {
        this.questions = [];
        return;
      }

      const selectedEntries = this.shuffle([...this.entries]).slice(
        0,
        Math.min(5, this.entries.length)
      );

      this.questions = selectedEntries.map((entry) => ({
        issueCode: entry.issueCode,
        department: entry.department,
        priority: entry.priority,
        correctAnswer: entry.responseText,
        options: this.buildOptions(entry),
      }));

      this.currentIndex = 0;
      this.selectedAnswer = "";
      this.checked = false;
      this.score = 0;
      this.showResults = false;
    },
    buildOptions(correctEntry) {
      const distractors = this.shuffle(
        this.entries.filter((entry) => entry._id !== correctEntry._id)
      )
        .slice(0, 3)
        .map((entry) => entry.responseText);

      return this.shuffle([correctEntry.responseText, ...distractors]);
    },
    shuffle(items) {
      const shuffled = [...items];

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [
          shuffled[randomIndex],
          shuffled[index],
        ];
      }

      return shuffled;
    },
    submitAnswer() {
      if (!this.currentQuestion || this.checked) {
        return;
      }

      if (!this.selectedAnswer) {
        this.flash("Please choose an answer first.", "warning", {
          timeout: 2000,
        });
        return;
      }

      this.checked = true;

      if (this.selectedAnswer === this.currentQuestion.correctAnswer) {
        this.score += 1;
        this.flash("Correct answer.", "success", {
          timeout: 2000,
        });
      } else {
        this.flash("Incorrect answer. Review the approved response below.", "warning", {
          timeout: 3000,
        });
      }
    },
    nextQuestion() {
      if (!this.currentQuestion) {
        return;
      }

      if (!this.checked) {
        this.submitAnswer();
        return;
      }

      if (this.currentIndex === this.questions.length - 1) {
        this.showResults = true;
        return;
      }

      this.currentIndex += 1;
      this.selectedAnswer = "";
      this.checked = false;
    },
    restartQuiz() {
      if (!this.quizReady) {
        return;
      }

      this.prepareQuestions();
      this.flash("A new quiz has been prepared.", "info", {
        timeout: 2000,
      });
    },
    priorityText(priority) {
      return priority || "Medium";
    },
    priorityClass(priority) {
      return `priority-${this.priorityText(priority).toLowerCase()}`;
    },
    optionClass(option) {
      if (!this.checked) {
        return "";
      }

      if (option === this.currentQuestion.correctAnswer) {
        return "correct";
      }

      if (option === this.selectedAnswer) {
        return "incorrect";
      }

      return "";
    },
  },
};
</script>
