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
  const adminUserId = bftLearnReviewAdminUserId(session?.user?.id);

  // For completed enrollments, only show feedback interface
  if (enrollment.progressStatus === "completed") {
    return (
      <div>
        <EnrollmentIdentity
          studentId={studentId}
          studentName={studentName}
          enrollment={enrollment}
          heading="Enrollment Feedback"
          currentCrumb="Feedback"
          description="Provide feedback on this student's completed work."
        />
        <EnrollmentFeedback
          enrollmentId={enrollment.id}
          adminUserId={adminUserId}
          studentName={studentName}
        />
      </div>
    );
  }

  // For other statuses, fetch review data
  const reviewId = enrollment.id.trim();
  const reviewResult = reviewId
    ? await getBftLearnReview(reviewId, adminUserId)
    : { error: "This enrollment does not include an enrollment ID, so it cannot be reviewed yet." };

  // Determine heading and description based on status
  const isToAssess = enrollment.progressStatus === "to_assess";
  const heading = isToAssess && mode === "assess" ? "Assess enrollment" : "Enrollment details";
  const currentCrumb = isToAssess && mode === "assess" ? "Assess" : "Enrollment";
  const description = isToAssess && mode === "assess"
    ? "Review each question, the student's answer, and the correct answer where one is available."
    : "Read-only details for this student's assigned content.";

  return (
    <div>
      <EnrollmentIdentity
        studentId={studentId}
        studentName={studentName}
        enrollment={enrollmentFromReview(enrollment, reviewResult)}
        heading={heading}
        currentCrumb={currentCrumb}
        description={description}
      />

      {"error" in reviewResult ? (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{reviewResult.error}</p>
      ) : isToAssess && mode === "assess" ? (
        <EnrollmentAssessment 
          review={reviewResult.data} 
          studentId={studentId}
          adminUserId={adminUserId}
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
