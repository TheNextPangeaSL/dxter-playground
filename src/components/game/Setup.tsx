// ---------------------------------------------------------------------------
// Setup.tsx – Redirects to Landing since difficulty selection is now
// integrated into the Landing page (matching the mock design).
// This component exists only as a fallback in case the "setup" phase
// is ever reached; it immediately transitions to the landing screen.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { goToLanding } from "@/stores/gameStore";

export default function Setup() {
  useEffect(() => {
    goToLanding();
  }, []);

  return null;
}
