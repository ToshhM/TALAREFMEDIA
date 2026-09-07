import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Erreur: SUPABASE_URL ou SUPABASE_SECRET_KEY non défini.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

const ADMIN_EMAIL = "mpika.toshiro@talaref.co";
const ADMIN_PASSWORD = "TalarefAgency2026!";
const ADMIN_PSEUDO = "Toshiro";

async function main() {
  console.log(`Recherche de l'utilisateur ${ADMIN_EMAIL}...`);
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Erreur lors de la liste des utilisateurs:", listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (existingUser) {
    console.log(`Utilisateur trouvé (${existingUser.id}). Mise à niveau vers le rôle admin...`);
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: "Toshiro Mpika",
          pseudonyme: ADMIN_PSEUDO,
          role: "admin",
        },
        app_metadata: {
          ...existingUser.app_metadata,
          role: "admin",
        },
      },
    );

    if (updateError) {
      console.error("Erreur mise à jour admin:", updateError.message);
      process.exit(1);
    }

    console.log(`✓ Compte admin mis à jour avec succès: ${updateData.user.email} (rôle: admin)`);
  } else {
    console.log(`Création du compte premier admin ${ADMIN_EMAIL}...`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Toshiro Mpika",
        pseudonyme: ADMIN_PSEUDO,
        role: "admin",
      },
      app_metadata: {
        role: "admin",
      },
    });

    if (createError) {
      console.error("Erreur création admin:", createError.message);
      process.exit(1);
    }

    console.log(`✓ Compte premier admin créé avec succès: ${createData.user.email} (rôle: admin)`);
  }
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
