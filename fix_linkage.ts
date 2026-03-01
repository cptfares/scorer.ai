import { supabaseAdmin } from "./server/supabase";

async function linkStartup() {
    const userEmail = "founder123@smu.inc"; // Replace with your email
    const startupName = "foundertest";      // Replace with your startup's exact or partial name

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("\nERROR: Missing environment variables!");
        console.log("Please run this command exactly as follows:");
        console.log("npx tsx --env-file=.env fix_linkage.ts\n");
        return;
    }

    console.log(`Searching for user: ${userEmail}...`);

    // 1. Get user id
    const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single();

    if (userError || !userData) {
        console.error("User not found in database. Please check the email address.");
        return;
    }

    console.log(`Found User ID: ${userData.id}`);
    console.log(`Linking to startup(s) matching: "${startupName}"...`);

    // 2. Update startup
    const { data, error } = await supabaseAdmin
        .from("startups")
        .update({ user_id: userData.id })
        .ilike("name", `%${startupName}%`);

    if (error) {
        console.error("Error linking startup:", error.message);
    } else {
        console.log(`\nSUCCESS: linked startup(s) matching "${startupName}" to ${userEmail}`);
        console.log("You can now refresh your dashboard.\n");
    }
}

linkStartup();
