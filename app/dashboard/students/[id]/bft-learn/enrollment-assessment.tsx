"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  bftLearnQuestionPrompt,
  formatBftReviewValue,
  resolveMultipleChoiceAnswer,
  type BftLearnReview,
  type BftLearnReviewQuestion,
} from "@/lib/bft-learn";

type QuestionGrade = {
  questionId: string;
  pointsEarned: number;
  pointsAvailable: number;
};

type QuestionFeedback = {
  questionId: string;
  feedback: string;
};

type Props = {
  review: BftLearnReview;
  studentId: string;
  adminUserId: string;
};

function displayValue(value: string): string {
  return value.trim() || "—";
}

export function EnrollmentAssessment({ review, studentId, adminUserId }: Props) {
  const router = useRouter();
  const [grades, setGrades] = useState<Map<string, QuestionGrade>>(new Map());
  const [feedback, setFeedback] = useState<Map<string, string>>(new Map());
  const [overallFeedback, setOverallFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debug: Log the entire review data structure
  useEffect(() => {
    console.log("[EnrollmentAssessment] Full review data:", {
      enrollment: review.enrollment,
      student: review.student,
      content: review.content,
      questionsCount: review.questions.length,
      firstQuestion: review.questions[0],
      allQuestions: review.questions,
    });
  }, [review]);

  // Initialize grades with 0 points for each question
  useEffect(() => {
    const initialGrades = new Map<string, QuestionGrade>();
    review.questions.forEach((q) => {
      initialGrades.set(q.questionId, {
        questionId: q.questionId,
        pointsEarned: 0,
        pointsAvailable: q.points,
      });
    });
    setGrades(initialGrades);
  }, [review.questions]);

  const handleGradeChange = useCallback((questionId: string, points: number) => {
    setGrades((prev) => {
      const newGrades = new Map(prev);
      const grade = newGrades.get(questionId);
      if (grade) {
        grade.pointsEarned = points;
        newGrades.set(questionId, grade);
      }
      return newGrades;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleFeedbackChange = useCallback((questionId: string, text: string) => {
    setFeedback((prev) => {
      const newFeedback = new Map(prev);
      newFeedback.set(questionId, text);
      return newFeedback;
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveAssessment = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/bft-learn/assessment/${encodeURIComponent(review.enrollment.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessedBy: adminUserId,
            questionGrades: Array.from(grades.values()),
            questionFeedback: Array.from(feedback.entries())
              .filter(([_, text]) => text.trim())
              .map(([questionId, feedbackText]) => ({
                questionId,
                feedback: feedbackText,
              })),
            overallFeedback: overallFeedback.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assessment");
      }

      toast.success("Assessment saved");
      setHasUnsavedChanges(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save assessment";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const completeAssessment = async () => {
    // Check all questions are graded
    const ungradedQuestions = review.questions.filter((q) => {
      const grade = grades.get(q.questionId);
      return !grade || grade.pointsEarned === undefined;
    });

    if (ungradedQuestions.length > 0) {
      toast.error("Please grade all questions before completing the assessment");
      return;
    }

    // Save first
    if (hasUnsavedChanges) {
      await saveAssessment();
    }

    const confirmed = window.confirm(
      "Complete this assessment? Points will be awarded and this cannot be undone."
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/bft-learn/assessment/${encodeURIComponent(review.enrollment.id)}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessedBy: adminUserId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete assessment");
      }

      toast.success("Assessment completed! Points have been awarded.");
      router.push(`/dashboard/students/${studentId}?tab=bft-learn`);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to complete assessment";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      void saveAssessment();
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, grades, feedback, overallFeedback]);

  const gradedCount = Array.from(grades.values()).filter(
    (g) => g.pointsEarned > 0
  ).length;

  if (review.questions.length === 0) {
    return (
      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Assessment
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No questions were returned for this enrollment.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      {/* Progress indicator */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            Grading Progress
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {gradedCount} / {review.questions.length} questions graded
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${(gradedCount / review.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Questions
        </h2>
        <ol className="space-y-8">
          {review.questions.map((question, index) => (
            <QuestionGradeCard
              key={question.questionId}
              question={question}
              index={index}
              grade={grades.get(question.questionId)}
              feedback={feedback.get(question.questionId) || ""}
              onGradeChange={handleGradeChange}
              onFeedbackChange={handleFeedbackChange}
            />
          ))}
        </ol>
      </div>

      {/* Overall feedback */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Overall Feedback
        </h2>
        <textarea
          value={overallFeedback}
          onChange={(e) => {
            setOverallFeedback(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Provide overall feedback for the student..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          rows={4}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={saveAssessment}
            disabled={saving || !hasUnsavedChanges}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={completeAssessment}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete Assessment
          </button>
        </div>
      </div>
    </section>
  );
}

type QuestionGradeCardProps = {
  question: BftLearnReviewQuestion;
  index: number;
  grade: QuestionGrade | undefined;
  feedback: string;
  onGradeChange: (questionId: string, points: number) => void;
  onFeedbackChange: (questionId: string, feedback: string) => void;
};

function QuestionGradeCard({
  question,
  index,
  grade,
  feedback,
  onGradeChange,
  onFeedbackChange,
}: QuestionGradeCardProps) {
  const prompt =
    bftLearnQuestionPrompt(question.questionContent) || `Question ${index + 1}`;
  
  // Debug logging
  console.log(`[Question ${index + 1}] Full question data:`, {
    questionContent: question.questionContent,
    studentAnswerRaw: question.studentAnswer,
    studentAnswerType: typeof question.studentAnswer,
    correctAnswerRaw: question.correctAnswer,
    correctAnswerType: typeof question.correctAnswer,
  });
  
  const studentAnswer = resolveMultipleChoiceAnswer(question.studentAnswer, question.questionContent);
  const correctAnswer = resolveMultipleChoiceAnswer(question.correctAnswer, question.questionContent);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // Determine if student answer is correct
  const hasCorrectAnswer = correctAnswer && correctAnswer.trim() !== "";
  const isCorrect = hasCorrectAnswer && studentAnswer === correctAnswer;
  const isIncorrect = hasCorrectAnswer && studentAnswer !== correctAnswer && studentAnswer && studentAnswer.trim() !== "";

  const handlePointsChange = (value: string) => {
    const points = parseInt(value) || 0;
    
    if (points < 0) {
      setPointsError("Points cannot be negative");
      return;
    }
    if (points > question.points) {
      setPointsError(`Points cannot exceed ${question.points}`);
      return;
    }
    
    setPointsError(null);
    onGradeChange(question.questionId, points);
  };

  return (
    <li className="border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0 dark:border-zinc-700">
      <p className="mb-4 text-base font-medium text-zinc-900 dark:text-zinc-50">
        {index + 1}. {prompt}
      </p>

      <div className="space-y-4">
        {/* Answers comparison */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`rounded-lg border p-4 ${
            isCorrect
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
              : isIncorrect
              ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
              : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
          }`}>
            <dt className={`mb-2 text-xs font-medium uppercase tracking-wide ${
              isCorrect
                ? "text-green-700 dark:text-green-400"
                : isIncorrect
                ? "text-red-700 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}>
              Student Answer
            </dt>
            <dd className={`whitespace-pre-wrap text-sm ${
              isCorrect
                ? "text-green-900 dark:text-green-50"
                : isIncorrect
                ? "text-red-900 dark:text-red-50"
                : "text-zinc-900 dark:text-zinc-50"
            }`}>
              {studentAnswer || (question.studentAnswer ? JSON.stringify(question.studentAnswer, null, 2) : "—")}
            </dd>
          </div>

          {correctAnswer && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Correct Answer
              </dt>
              <dd className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                {correctAnswer}
              </dd>
            </div>
          )}
        </div>

        {/* Points input */}
        <div>
          <label
            htmlFor={`points-${question.questionId}`}
            className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Points Earned
          </label>
          <div className="flex items-center gap-3">
            <input
              id={`points-${question.questionId}`}
              type="number"
              min={0}
              max={question.points}
              value={grade?.pointsEarned ?? 0}
              onChange={(e) => handlePointsChange(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              / {question.points} points
            </span>
          </div>
          {pointsError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{pointsError}</p>
          )}
        </div>

        {/* Feedback textarea */}
        <div>
          <label
            htmlFor={`feedback-${question.questionId}`}
            className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Feedback for Student
          </label>
          <textarea
            id={`feedback-${question.questionId}`}
            value={feedback}
            onChange={(e) => onFeedbackChange(question.questionId, e.target.value)}
            placeholder="Provide specific feedback for this question..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={3}
          />
        </div>
      </div>
    </li>
  );
}
