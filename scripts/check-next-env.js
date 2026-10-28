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

  if (name.endsWith('_URL')) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw Error();
    } catch { console.error(`${name}=INVALID_URL (expected https://your-project.supabase.co)`); hasErrors = true; continue; }
  }
  if (name.endsWith('_KEY') && (!/^(sb_publishable_|eyJ)/.test(value) || value.startsWith('sb_secret_'))) {
    console.error(`${name}=INVALID_PUBLIC_KEY`); hasErrors = true; continue;
  }

  console.log(`${name}=SET`);
}

if (hasErrors) {
  process.exit(1);
}
