import { notFound } from "next/navigation";
import { getStudentById } from "@/lib/db";
import { getBftLearnEnrollment } from "@/lib/bft-learn";
import { EnrollmentIdentity } from "./enrollment-identity";

export const dynamic = "force-dynamic";

type Props = {
  studentId: string;
  entryId: string;
  mode: "view" | "assess";
};

export async function BftLearnEnrollmentPage({ studentId, entryId, mode }: Props) {
  const student = await getStudentById(studentId);
  if (!student) notFound();

  const result = await getBftLearnEnrollment(studentId, entryId);
  if ("notFound" in result) notFound();

  if ("error" in result) {
    const studentName = `${student.first_name} ${student.last_name}`.trim();
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

  const studentName = `${student.first_name} ${student.last_name}`.trim() || "Student";

  if (mode === "assess") {
    return (
      <EnrollmentIdentity
        studentId={studentId}
        studentName={studentName}
        enrollment={result.enrollment}
        heading="Assess enrollment"
        currentCrumb="Assess"
        description="This enrollment is ready for assessment. Marking is not available in this admin view yet."
      />
    );
  }

  return (
    <EnrollmentIdentity
      studentId={studentId}
      studentName={studentName}
      enrollment={result.enrollment}
      heading="Enrollment details"
      currentCrumb="Enrollment"
      description="Read-only details for this student's assigned content."
    />
  );
}
