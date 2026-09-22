import {
  bftLearnProgressStatusLabel,
  bftLearnQuestionPrompt,
  formatBftReviewValue,
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
          const studentAnswer = formatBftReviewValue(question.studentAnswer);
          const correctAnswer = formatBftReviewValue(question.correctAnswer);

          return (
            <li
              key={question.questionId}
              className="border-t border-zinc-200 pt-6 first:border-t-0 first:pt-0 dark:border-zinc-700"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {index + 1}. {prompt}
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Student answer
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                    {displayValue(studentAnswer)}
                  </dd>
                </div>
                {correctAnswer ? (
                  <div>
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
