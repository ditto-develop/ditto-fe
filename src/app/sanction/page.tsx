import { Suspense } from "react";

import { SanctionContainer } from "@/features/sanction";

export default function SanctionPage() {
  return (
    <Suspense>
      <SanctionContainer />
    </Suspense>
  );
}
