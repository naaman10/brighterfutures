import { BftLearnEnrollmentPage } from "../enrollment-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; entryId: string }>;
  searchParams: Promise<{ enrollmentId?: string }>;
};

export default async function ViewBftLearnEnrollmentPage({ params, searchParams }: Props) {
  const { id: studentId, entryId } = await params;
  const { enrollmentId } = await searchParams;
  return (
    <BftLearnEnrollmentPage
      studentId={studentId}
      entryId={entryId}
      enrollmentId={enrollmentId}
      mode="view"
    />
  );
}
