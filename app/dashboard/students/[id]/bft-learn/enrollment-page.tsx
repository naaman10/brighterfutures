import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getStudentById } from "@/lib/db";
import {
  bftLearnReviewAdminUserId,
  getBftLearnEnrollment,
  getBftLearnReview,
  type BftLearnEnrollment,
} from "@/lib/bft-learn";
import { EnrollmentIdentity } from "./enrollment-identity";
import { EnrollmentReviewQuestions } from "./enrollment-review-questions";
import { EnrollmentAssessment } from "./enrollment-assessment";
import { EnrollmentFeedback } from "./enrollment-feedback";

export const dynamic = "force-dynamic";

type Props = {
  studentId: string;
  entryId: string;
  mode: "view" | "assess";
};

export async function BftLearnEnrollmentPage({
  studentId,
  entryId,
  mode,
}: Props) {
  const student = await getStudentById(studentId);
  if (!student) notFound();

  const result = await getBftLearnEnrollment(studentId, entryId);
  if ("notFound" in result) notFound();

  const studentName = `${student.first_name} ${student.last_name}`.trim() || "Student";

  if ("error" in result) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {mode === "assess" ? "Assess enrollment" : "Enrollment details"}
        </h1>
        <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Could not load this enrollment for {studentName}.
        </p>
      </div>
    );
  }

  const enrollment = result.enrollment;
  const session = await auth();
  const reviewId = enrollment.id.trim();
  const reviewResult = reviewId
    ? await getBftLearnReview(reviewId, bftLearnReviewAdminUserId(session?.user?.id))
    : { error: "This enrollment does not include an enrollment ID, so it cannot be reviewed yet." };

  return (
    <div>
      <EnrollmentIdentity
        studentId={studentId}
        studentName={studentName}
        enrollment={enrollmentFromReview(enrollment, reviewResult)}
        heading={mode === "assess" ? "Assess enrollment" : "Enrollment details"}
        currentCrumb={mode === "assess" ? "Assess" : "Enrollment"}
        description={
          mode === "assess"
            ? "Review each question, the student's answer, and the correct answer where one is available."
            : "Read-only details for this student's assigned content."
        }
      />

      {"error" in reviewResult ? (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{reviewResult.error}</p>
      ) : mode === "assess" ? (
        <EnrollmentAssessment 
          review={reviewResult.data} 
          studentId={studentId}
          adminUserId={bftLearnReviewAdminUserId(session?.user?.id)}
        />
      ) : enrollment.progressStatus === "completed" ? (
        <EnrollmentFeedback
          enrollmentId={enrollment.id}
          adminUserId={bftLearnReviewAdminUserId(session?.user?.id)}
          studentName={studentName}
        />
      ) : (
        <EnrollmentReviewQuestions review={reviewResult.data} />
      )}
    </div>
  );
}

function enrollmentFromReview(
  enrollment: BftLearnEnrollment,
  reviewResult: Awaited<ReturnType<typeof getBftLearnReview>> | { error: string }
): BftLearnEnrollment {
  if ("error" in reviewResult) return enrollment;
  const { content, enrollment: reviewed } = reviewResult.data;
  return {
    ...enrollment,
    id: reviewed.id || enrollment.id,
    entryId: content.entryId || enrollment.entryId,
    name: content.name || enrollment.name,
    type: content.type || enrollment.type,
    subject: content.subject || enrollment.subject,
    ageGroup: content.ageGroup || enrollment.ageGroup,
    status: reviewed.status || enrollment.status,
    progressStatus: reviewed.progressStatus || enrollment.progressStatus,
  };
}
