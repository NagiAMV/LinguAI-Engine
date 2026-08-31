const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

let hasErrors = false;

for (const name of requiredEnv) {
  const value = process.env[name];

  if (!value) {
    console.error(`${name}=MISSING`);
    hasErrors = true;
    continue;
  }

  if (value.includes("your-") || value.includes("your_")) {
    console.error(`${name}=PLACEHOLDER`);
    hasErrors = true;
    continue;
  }

  console.log(`${name}=SET`);
}

if (hasErrors) {
  process.exit(1);
}
