import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="app-shell min-h-screen" />}>
      <LoginClient />
    </Suspense>
  );
}
