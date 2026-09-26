import {
  bftLearnProgressStatusLabel,
  bftLearnQuestionPrompt,
  formatBftReviewValue,
  resolveMultipleChoiceAnswer,
  type BftLearnReview,
} from "@/lib/bft-learn";

function displayValue(value: string): string {
  return value.trim() || "—";
}

export function EnrollmentReviewQuestions({ review }: { review: BftLearnReview }) {
  if (review.questions.length === 0) {
    return (
      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Questions
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No questions were returned for this enrollment.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Questions
      </h2>
      <ol className="space-y-6">
        {review.questions.map((question, index) => {
          const prompt =
            bftLearnQuestionPrompt(question.questionContent) || `Question ${index + 1}`;
          const studentAnswer = resolveMultipleChoiceAnswer(question.studentAnswer, question.questionContent);
          const correctAnswer = resolveMultipleChoiceAnswer(question.correctAnswer, question.questionContent);

          // Determine if student answer is correct
          const hasCorrectAnswer = correctAnswer && correctAnswer.trim() !== "";
          const isCorrect = hasCorrectAnswer && studentAnswer === correctAnswer;
          const isIncorrect = hasCorrectAnswer && studentAnswer !== correctAnswer && studentAnswer && studentAnswer.trim() !== "";

          return (
            <li
              key={question.questionId}
              className="border-t border-zinc-200 pt-6 first:border-t-0 first:pt-0 dark:border-zinc-700"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {index + 1}. {prompt}
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-lg border p-3 ${
                  isCorrect
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : isIncorrect
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                }`}>
                  <dt className={`text-xs font-medium uppercase tracking-wide ${
                    isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : isIncorrect
                      ? "text-red-700 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    Student answer
                  </dt>
                  <dd className={`mt-0.5 whitespace-pre-wrap text-sm ${
                    isCorrect
                      ? "text-green-900 dark:text-green-50"
                      : isIncorrect
                      ? "text-red-900 dark:text-red-50"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}>
                    {displayValue(studentAnswer)}
                  </dd>
                </div>
                {correctAnswer ? (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Correct answer
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                      {correctAnswer}
                    </dd>
                  </div>
                ) : null}
                {question.points > 0 ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Points
                    </dt>
                    <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                      {question.points}
                    </dd>
                  </div>
                ) : null}
                {question.status ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Status
                    </dt>
                    <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                      {bftLearnProgressStatusLabel(question.status)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
