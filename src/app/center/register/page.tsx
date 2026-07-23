import { PageHeader } from "@/components/ui";
import { FounderRegisterForm } from "@/components/founder-register-form";

export default function CenterRegisterPage() {
  return (
    <div>
      <PageHeader title="센터 창업자 등록" description="센터 담당자가 직접 창업자·기업을 등록합니다." />
      <FounderRegisterForm />
    </div>
  );
}
