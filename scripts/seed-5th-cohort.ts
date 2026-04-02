import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const startups = [
  { name: "PolstarAI (SamyBear)", category: "AI/ML", stage: "MVP", website: "www.polstarai.com", description: "A child-centered AI companion built with safety by design. Parent-in-the-loop supervision, on-device privacy-first processing, and real-time distress detection. Aligned with UNICEF child-centered AI principles.", team_size: "3", revenue_model: "Consumer devices with optional subscriptions, institutional pilots, long-term licensing of child-safe AI frameworks.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Slim Haj Salah", role: "CEO" }, { name: "Mortadha Ben Araar", role: "CTO" }, { name: "Nour Daas", role: "CMO" }] },
  { name: "Seed Up", category: "FinTech", stage: "MVP", website: "", description: "Tunisia's first P2B crowdlending platform connecting investors directly with SMEs, providing fast, mortgage-free capital and superior returns. 10% ROI for investors, 3x traditional rates.", team_size: "3", revenue_model: "Success fees, subscriptions, and white-labeling. 60% Green Portfolio leveraging RSE laws for tax incentives.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Seif Namissi", role: "Founder" }, { name: "Karim Namissi", role: "Co-Founder" }, { name: "Shahrazed El Adhami", role: "CMO" }] },
  { name: "Workway", category: "Other", stage: "MVP", website: "", description: "A B2B carpooling platform connecting colleagues to share daily commutes, reducing costs, stress, and carbon footprint while improving employer branding. Starting with Grand Tunis.", team_size: "3", revenue_model: "Usage-based model: companies pay per trip via a points system, 20% commission per ride.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Mohamed Ali Kanzari", role: "CEO" }, { name: "Mohamed Hachicha", role: "COO" }, { name: "Wael Motamed", role: "CTO" }] },
  { name: "Déligo", category: "Other", stage: "Idea", website: "", description: "A digital platform for licensed movers making urban delivery predictable and professional. Transparent pricing, GPS tracking, and ratings for customers. More jobs and no middlemen for drivers.", team_size: "2", revenue_model: "Usage-based commission per move; Déligo takes a % from each completed job.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Malek Khouama", role: "CEO" }, { name: "Fady Hachani", role: "CTO" }] },
  { name: "Velp (Dipawer)", category: "Other", stage: "MVP", website: "", description: "Pet-care super-app connecting pet parents and pet professionals in one marketplace. Pet parents access pet services and track pet health; professionals manage clients via a CRM.", team_size: "3", revenue_model: "10% commission on each completed transaction from pet professionals.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Maha Essoussi", role: "Co-founder & CEO" }, { name: "François Bioche", role: "Co-founder & CSO" }, { name: "Dali Jelidi", role: "Co-Founder & CTO" }] },
  { name: "Sensaura", category: "HealthTech", stage: "Idea", website: "", description: "A smart storytelling companion for children with autism. Integrates interactive narratives into a soft teddy bear with physical buttons and calming visuals, replacing screens with a low-stress multisensory experience.", team_size: "1", revenue_model: "One-time hardware sale (plushie + 3 starter stories) + monthly Story Pass subscription for expanding story library.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Ahmed Khalil Bouchach", role: "Founder" }] },
  { name: "SenseBridge", category: "AI/ML", stage: "MVP", website: "", description: "AI accessibility platform for visually impaired and blind users with real-time obstacle detection, instant multilingual OCR text recognition, and scene understanding with natural language description.", team_size: "1", revenue_model: "B2C: Freemium with ads, premium at $4.99/month, hardware bundles. B2B: Enterprise licensing, accessibility compliance solutions.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Khaoula Maleh", role: "Founder" }] },
  { name: "Vizflat", category: "Other", stage: "", website: "", description: "", team_size: "1", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Mohsen Mechalia", role: "Founder" }] },
  { name: "My Consultia", category: "Other", stage: "", website: "", description: "", team_size: "4", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Hydeya Samti", role: "" }, { name: "Mohamed Amine Ouelhazi", role: "" }, { name: "Cyrine Ben Hamouda", role: "" }, { name: "Hadyle Samti", role: "" }] },
  { name: "Qcmed", category: "HealthTech", stage: "", website: "", description: "", team_size: "3", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Wala Bouzouita", role: "CEO" }, { name: "Firas Mtibaa", role: "CTO" }, { name: "Aya Bhouri", role: "Marketing Strategy & Content Manager" }] },
  { name: "INTOM", category: "Other", stage: "MVP", website: "", description: "Travel platform directly connecting travelers with verified local guides for authentic cultural and everyday local activities. Ensures money spent supports local communities.", team_size: "2", revenue_model: "Transaction fees per booking, premium features for travelers and guides, partnerships with local businesses.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Aziz Mekki", role: "CEO" }, { name: "Nour Kalboussi", role: "CMO" }] },
  { name: "GoToGreen (Pass2Green)", category: "CleanTech", stage: "MVP", website: "", description: "AI-powered platform automating product carbon footprint calculation, delivering reduction insights, and generating digital product passports for export-oriented manufacturing SMEs.", team_size: "3", revenue_model: "B2B SaaS subscriptions, digital product passport fees, sustainability consulting services.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Nour Jeday", role: "Co-founder & CEO" }, { name: "Salim Hamouda", role: "Head of Marketing & Development" }, { name: "Nour Nsiri", role: "Head of Business & Finance" }] },
  { name: "VibeFlow AI", category: "AI/ML", stage: "Beta", website: "www.vibeflowai.site", description: "All-in-one AI-powered marketing platform enabling startups and small businesses to create, execute, analyze, and optimize complete marketing campaigns in minutes without agencies or marketing expertise.", team_size: "2", revenue_model: "SaaS subscription: Starter $49/month, Pro $89/month, Premium $119/month.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Alaa Touati", role: "Co-founder & CEO" }, { name: "Ali Ben Abdallah", role: "Co-founder & COO" }] },
  { name: "Attoset", category: "AI/ML", stage: "Beta", website: "www.attoset.com", description: "Work OS – a SaaS platform of flexible building blocks that teams combine to organize and execute work their way. Teams can model data, automate workflows, build dashboards, and collaborate in one intelligent system.", team_size: "4", revenue_model: "SaaS tiered subscriptions, usage-based add-ons (storage, automation, AI credits), pro services, courses & certifications.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Youssef Mejri", role: "Cofounder & Manager" }, { name: "Mohamed Habib Grami", role: "Cofounder & Technical Manager" }, { name: "Rayen Inoubli", role: "Co-founder & Lead Engineer" }, { name: "Chaima Ben Mahmoud", role: "Operations" }] },
  { name: "GenAlpha", category: "EdTech", stage: "MVP", website: "", description: "Tunisia-based EdTech platform bridging learning and employment through a learning-to-earning ecosystem. Courses end with real capstone projects producing a public portfolio proving skills to employers.", team_size: "6", revenue_model: "Cohort-based paid courses, revenue share marketplace with trainers (40-60%), institutional partnerships, future subscription model.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Nassim Cheikh", role: "Co-founder & CEO" }, { name: "Melek Maaroufi", role: "Co-founder & COO" }, { name: "Amira Nassri", role: "Developer & Blockchain Specialist" }, { name: "Khairi Hammami", role: "Engineer in Systems & Data" }, { name: "Ines Werhani", role: "Community Manager" }, { name: "Malek Goutali", role: "Sales & Partnerships" }] },
  { name: "UrbaSense", category: "AI/ML", stage: "Idea", website: "", description: "Decision-intelligence startup building a web platform that evaluates land and urban projects before construction through standardized feasibility analysis using an Urban Feasibility Index (UFI) score.", team_size: "1", revenue_model: "Annual B2B credit packs, firm-level shared credit systems, B2C pay-per-analysis.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Aya Hachana", role: "Founder" }] },
  { name: "The Areté Protocol", category: "AI/ML", stage: "Idea", website: "", description: "AI-powered decision integrity system helping executives act confidently before costly mistakes occur. Monitors for deviations caused by stress, fatigue, or cognitive overload using behavioral cues and real-time biomarkers.", team_size: "1", revenue_model: "$149/month individual, $299/month enterprise, $99/seat (20+ minimum). Target: $1.6M ARR.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Sabrine Hammami", role: "Founder & CEO" }, { name: "Sami Ben Hassine", role: "Mentor & Advisor" }] },
  { name: "Microexist", category: "Other", stage: "", website: "", description: "", team_size: "2", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Nadhim Jerbi", role: "Founder & CEO" }, { name: "Aziz Ben Zarkouna", role: "Business Developer" }] },
  { name: "Volunteery", category: "Other", stage: "", website: "", description: "", team_size: "2", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Mohamed Ali Tobbi", role: "" }, { name: "Mohamed Salmen Gharselloui", role: "" }] },
  { name: "Soleya", category: "HealthTech", stage: "MVP", website: "", description: "Hybrid HealthTech platform (physical & digital) optimizing the post-diagnostic journey through a personalized 360° approach covering mind, nutrition, and body support. Merges regenerative nutrition and agroecology with chronic disease care.", team_size: "3", revenue_model: "B2C: Direct sales (meals & workshops). B2B: Institutional contracts. SaaS: App subscriptions.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Sonia Mfarrej", role: "Founder & CEO" }, { name: "Gilbert Casaburi", role: "Author & Culinary Chef, Natural Cuisine Specialist" }, { name: "Inès Bhiri", role: "Marketing Manager" }] },
  { name: "BarakEat", category: "Other", stage: "MVP", website: "", description: "Digital platform allowing food businesses to sell daily surplus through discounted surprise bags at one-third of market value. Businesses recover losses, consumers save money, and food waste is reduced.", team_size: "2", revenue_model: "Commission on each transaction with no fixed costs for partner businesses. Asset-light, scalable model.", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Youssef Chebil", role: "" }, { name: "Yassine Zaghouani", role: "" }] },
  { name: "Vntr", category: "Other", stage: "", website: "", description: "", team_size: "3", revenue_model: "", one_pager_link: "https://www.canva.com/design/DAHAW-0KQLo/N70CGDsI88czoEVeFe-MkA/edit", team: [{ name: "Chedly Ghrobel", role: "" }, { name: "Youcef Ouhab", role: "" }, { name: "Malek Gharssallah", role: "" }] },
];

async function seed() {
  console.log("🌱 Seeding 5th cohort startups...\n");

  // Find or create the "5th" cohort
  let { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name")
    .eq("name", "5th")
    .single();

  if (!cohort) {
    const { data: created, error } = await supabase
      .from("cohorts")
      .insert({ name: "5th", description: "5th cohort startups", is_active: true })
      .select()
      .single();
    if (error) { console.error("Failed to create cohort:", error.message); process.exit(1); }
    cohort = created;
    console.log(`✓ Created cohort: ${cohort.name} (id: ${cohort.id})`);
  } else {
    console.log(`✓ Using existing cohort: ${cohort.name} (id: ${cohort.id})`);
  }

  console.log(`\nInserting ${startups.length} startups...`);
  let inserted = 0;
  for (const s of startups) {
    const { error } = await supabase.from("startups").insert({
      name: s.name,
      category: s.category,
      stage: s.stage || null,
      website: s.website || null,
      description: s.description || null,
      team_size: s.team_size,
      revenue_model: s.revenue_model || null,
      one_pager_link: s.one_pager_link || null,
      team: s.team,
      cohort_id: cohort.id,
      founded: null,
      funding_seek: null,
    });
    if (error) {
      console.error(`  ✗ ${s.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${s.name}`);
      inserted++;
    }
  }

  console.log(`\n✅ Done — ${inserted}/${startups.length} startups inserted into cohort "${cohort.name}"`);
}

seed().catch(err => { console.error(err); process.exit(1); });
