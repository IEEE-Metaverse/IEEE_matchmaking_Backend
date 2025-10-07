// routes/questionnaire.js
import express from "express";
import supabase from "../supabaseClient.js";
import requireAuth from "../middleware/requireAuth.js";
import supabaseAdmin from "../supabaseAdmin.js";

const router = express.Router();

// Allowed questionnaire keys (update if questions.js changes)
const allowed = [
  "role", "affiliation", "seniority", "linkedin_url", "researcher_ids", "core_research_areas", "subfields_domains",
  "problems_top_questions", "goals_outcomes", "top_3_collab_topics",
  "evaluation_metrics", "experimental_scale", "standards_protocols", "seeking", "offering", "collaborator_background",
  "data_sharing_constraints", "ip_licensing_stance", "claude_recommendation", "lama_recommendation", "anthropic_recommendation", "mutual_recommendation"
];

// SAVE questionnaire endpoint
router.post("/save", requireAuth, async (req, res) => {
  try {
    const authUser = req.user;
    const answers = req.body.answers || {};

    // Fetch full user info using Supabase Admin
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
    if (error || !data?.user) throw new Error("User not found");

    const user = data.user;

    // Simply take the array from frontend, like top_3_collab_topics
// Build formatted object
const formatted = {};

// Take problems_top_questions array directly from frontend
if (answers.problems_top_questions && Array.isArray(answers.problems_top_questions)) {
  formatted.problems_top_questions = answers.problems_top_questions;
}

// Copy other allowed fields
for (const k of allowed) {
  if (k === "problems_top_questions") continue;
  if (k in answers) {
    const v = answers[k];
    if (Array.isArray(v)) formatted[k] = v;
    else if (typeof v === "object" && v !== null) formatted[k] = v;
    else formatted[k] = v ?? null;
  }
}


    // Set name and email correctly
    formatted.name = user.user_metadata?.full_name || null;
    formatted.email = user.email || null;

    // Upsert in Supabase
    const { data: existing, error: selectError } = await supabase
      .from("questionnaire_responses")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (selectError) throw selectError;

    let savedRecord;
    if (existing) {
      formatted.updated_at = new Date().toISOString();
      const { data, error: updateError } = await supabase
        .from("questionnaire_responses")
        .update(formatted)
        .eq("user_id", authUser.id)
        .select()
        .single();
      if (updateError) throw updateError;
      savedRecord = data;
    } else {
      const payload = { user_id: authUser.id, ...formatted };
      const { data, error: insertError } = await supabase
        .from("questionnaire_responses")
        .insert([payload])
        .select()
        .single();
      if (insertError) throw insertError;
      savedRecord = data;
    }

    // --------------------------
    //  🚀 Trigger webhook here
    // --------------------------
    if (process.env.WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedRecord),
        });

        if (!response.ok) {
          console.error("Webhook call failed", await response.text());
        } else {
          console.log("Webhook triggered successfully for user:", authUser.id);
        }
      } catch (webhookErr) {
        console.error("Error triggering webhook:", webhookErr);
      }
    }

    res.json({ message: existing ? "Updated successfully" : "Inserted successfully" });

  } catch (err) {
    console.error("Questionnaire save error:", err);
    res.status(500).json({ error: err.message || err });
  }
});


// GET current user's questionnaire
router.get("/me", requireAuth, async (req, res) => {
  try {
    const authUser = req.user;

    const { data, error } = await supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (error) throw error;
    res.json(data || null);
  } catch (err) {
    console.error("Questionnaire fetch error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

export default router;
