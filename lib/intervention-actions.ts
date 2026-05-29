"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionType, CohortTier } from "@/lib/intervention-logs";

type LogInterventionInput = {
  studentId: string;
  actionType: ActionType;
  cohortTier: CohortTier;
  studentEmailDraft?: string;
  parentEmailDraft?: string;
};

export async function logIntervention(
  input: LogInterventionInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("intervention_logs").insert({
      student_id: input.studentId,
      action_type: input.actionType,
      cohort_tier: input.cohortTier,
      student_email_draft: input.studentEmailDraft ?? null,
      parent_email_draft: input.parentEmailDraft ?? null,
      is_seed: false,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/v1-prototype");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function markBatchSent(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("intervention_logs")
      .update({ emails_sent_at: new Date().toISOString() })
      .eq("action_type", "support")
      .eq("is_seed", false)
      .is("emails_sent_at", null);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/v1-prototype");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function resetDemoInterventions(): Promise<{ ok: boolean; error?: string }> {
  if (process.env.DEMO_RESET_ENABLED !== "true") {
    return { ok: false, error: "Demo reset not enabled" };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("intervention_logs").delete().eq("is_seed", false);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/v1-prototype");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
