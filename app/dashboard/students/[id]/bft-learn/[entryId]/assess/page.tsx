import { BftLearnEnrollmentPage } from "../../enrollment-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; entryId: string }>;
};

export default async function AssessBftLearnEnrollmentPage({ params }: Props) {
  const { id: studentId, entryId } = await params;
  return (
    <BftLearnEnrollmentPage
      studentId={studentId}
      entryId={entryId}
      mode="assess"
    />
  );
}
