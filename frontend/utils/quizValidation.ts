// Full validation implementation used by Quiz component
import { QuizQuestion, UserAnswer, ValidationResult } from "@/types/quiz";

export class QuizValidation {
  /**
   * Validates a user's answer for a specific question
   */
  validateAnswer(
    question: QuizQuestion,
    userAnswer: string | string[]
  ): ValidationResult {
    switch (question.type) {
      case "multiple_choice":
        return this.validateMultipleChoice(question, userAnswer as string);

      case "short_answer":
        return this.validateShortAnswer(question, userAnswer as string);

      case "practical":
        return this.validatePracticalExercise(question, userAnswer as string);

      default:
        return {
          isCorrect: false,
          score: 0,
          feedback: "Unknown question type",
        };
    }
  }

  /**
   * Validates multiple choice questions
   */
  private validateMultipleChoice(
    question: QuizQuestion,
    userAnswer: string
  ): ValidationResult {
    if (!question.answer) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "No correct answer defined for this question",
      };
    }

    const isCorrect =
      userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect
        ? "Correct! Well done."
        : `Incorrect. The correct answer is: ${question.answer}`,
      explanation: question.explanation,
    };
  }

  /**
   * Validates short answer questions
   */
  private validateShortAnswer(
    question: QuizQuestion,
    userAnswer: string
  ): ValidationResult {
    const answer = userAnswer.trim();

    // Basic validation
    if (answer.length < 10) {
      return {
        isCorrect: false,
        score: 25,
        feedback: "Your answer is too brief. Please provide more detail.",
      };
    }

    if (answer.length < 30) {
      return {
        isCorrect: true,
        score: 60,
        feedback:
          "Good start! Consider adding more detail to demonstrate deeper understanding.",
      };
    }

    // Check for key points coverage
    let score = 70;
    let keyPointsCovered = 0;
    const feedback: string[] = [];

    if (question.key_points && question.key_points.length > 0) {
      question.key_points.forEach((keyPoint, index) => {
        // Simple keyword matching (could be enhanced with NLP)
        const keywords = keyPoint
          .toLowerCase()
          .split(" ")
          .filter((word) => word.length > 3);
        const answerLower = answer.toLowerCase();

        const keywordMatches = keywords.filter((keyword) =>
          answerLower.includes(keyword)
        ).length;

        if (keywordMatches > 0) {
          keyPointsCovered++;
          score += 10;
        }
      });

      const coveragePercentage =
        (keyPointsCovered / question.key_points.length) * 100;

      if (coveragePercentage >= 80) {
        feedback.push("Excellent coverage of key concepts!");
      } else if (coveragePercentage >= 50) {
        feedback.push(
          "Good understanding, but consider addressing more key points."
        );
      } else {
        feedback.push(
          "Try to address the key points mentioned in the question."
        );
      }
    }

    return {
      isCorrect: score >= 70,
      score: Math.min(score, 100),
      feedback:
        feedback.join(" ") ||
        "Your answer demonstrates understanding of the topic.",
    };
  }

  /**
   * Validates practical exercise submissions
   */
  private validatePracticalExercise(
    question: QuizQuestion,
    userAnswer: string
  ): ValidationResult {
    const answer = userAnswer.trim();

    // Basic submission validation
    if (answer.length < 50) {
      return {
        isCorrect: false,
        score: 20,
        feedback:
          "Please provide more detail about your work, including your approach and any challenges faced.",
      };
    }

    let score = 60; // Base score for submitting something substantial
    const feedback: string[] = [];

    // Check for common indicators of good practical work
    const qualityIndicators = [
      {
        pattern: /github|gitlab|repository|repo/i,
        points: 15,
        description: "code repository",
      },
      {
        pattern: /demo|live|deployed|url|link/i,
        points: 10,
        description: "live demo or deployment",
      },
      {
        pattern: /challenge|problem|issue|debug/i,
        points: 10,
        description: "problem-solving discussion",
      },
      {
        pattern: /test|testing|spec/i,
        points: 10,
        description: "testing approach",
      },
      {
        pattern: /screenshot|image|video/i,
        points: 5,
        description: "visual documentation",
      },
    ];

    qualityIndicators.forEach((indicator) => {
      if (indicator.pattern.test(answer)) {
        score += indicator.points;
        feedback.push(`✓ Includes ${indicator.description}`);
      }
    });

    // Check for success criteria coverage if provided
    if (question.success_criteria && question.success_criteria.length > 0) {
      let criteriaMet = 0;

      question.success_criteria.forEach((criteria) => {
        // Simple keyword matching
        const keywords = criteria
          .toLowerCase()
          .split(" ")
          .filter((word) => word.length > 3);
        const answerLower = answer.toLowerCase();

        const matches = keywords.filter((keyword) =>
          answerLower.includes(keyword)
        ).length;
        if (matches > 0) {
          criteriaMet++;
        }
      });

      const criteriaPercentage =
        (criteriaMet / question.success_criteria.length) * 100;
      if (criteriaPercentage >= 70) {
        score += 20;
        feedback.push("✓ Addresses most success criteria");
      } else if (criteriaPercentage >= 40) {
        score += 10;
        feedback.push("◐ Addresses some success criteria");
      }
    }

    const finalScore = Math.min(score, 100);
    const isCorrect = finalScore >= 70;

    return {
      isCorrect,
      score: finalScore,
      feedback:
        feedback.length > 0
          ? feedback.join("\n")
          : "Thank you for your submission. Work has been recorded for review.",
    };
  }

  /**
   * Calculates overall quiz score
   */
  calculateScore(
    answers: Record<string, UserAnswer>,
    questions: QuizQuestion[]
  ): number {
    if (questions.length === 0) return 0;

    const totalScore = questions.reduce((sum, question) => {
      const answer = answers[question.id];
      return sum + (answer?.score || 0);
    }, 0);

    return totalScore;
  }

  /**
   * Gets percentage score
   */
  getPercentageScore(
    answers: Record<string, UserAnswer>,
    questions: QuizQuestion[]
  ): number {
    const totalScore = this.calculateScore(answers, questions);
    const maxScore = questions.length * 100;
    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  }

  /**
   * Determines if quiz is passed based on score threshold
   */
  isQuizPassed(
    answers: Record<string, UserAnswer>,
    questions: QuizQuestion[],
    passThreshold: number = 70
  ): boolean {
    const percentage = this.getPercentageScore(answers, questions);
    return percentage >= passThreshold;
  }

  /**
   * Gets detailed analytics for quiz performance
   */
  getQuizAnalytics(
    answers: Record<string, UserAnswer>,
    questions: QuizQuestion[]
  ) {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const correctAnswers = Object.values(answers).filter(
      (a) => a.isCorrect
    ).length;
    const incorrectAnswers = Object.values(answers).filter(
      (a) => !a.isCorrect
    ).length;
    const unansweredQuestions = totalQuestions - answeredQuestions;

    const questionTypeBreakdown = questions.reduce((acc, question) => {
      const answer = answers[question.id];
      if (!acc[question.type]) {
        acc[question.type] = { total: 0, correct: 0, answered: 0 };
      }
      acc[question.type].total++;
      if (answer) {
        acc[question.type].answered++;
        if (answer.isCorrect) {
          acc[question.type].correct++;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; correct: number; answered: number }>);

    return {
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      correctAnswers,
      incorrectAnswers,
      percentageScore: this.getPercentageScore(answers, questions),
      isPassed: this.isQuizPassed(answers, questions),
      questionTypeBreakdown,
      averageScore:
        answeredQuestions > 0
          ? this.calculateScore(answers, questions) / answeredQuestions
          : 0,
    };
  }
}
