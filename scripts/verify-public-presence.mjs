/**
 * Public project presence rules. Run with:
 *   node scripts/verify-public-presence.mjs
 */

function resolvePublicPresence({ hidden, managedPublished }) {
  if (hidden) return "hidden";
  if (managedPublished) return "managed";
  return "static";
}

const cases = [
  {
    name: "never managed → static fallback",
    input: { hidden: false, managedPublished: false },
    want: "static",
  },
  {
    name: "ROSIE: no Supabase row, not hidden → static ROSIE",
    input: { hidden: false, managedPublished: false },
    want: "static",
  },
  {
    name: "intentionally hidden → no output (does not resurrect static)",
    input: { hidden: true, managedPublished: false },
    want: "hidden",
  },
  {
    name: "hidden even if a published managed row exists",
    input: { hidden: true, managedPublished: true },
    want: "hidden",
  },
  {
    name: "managed + published → managed output",
    input: { hidden: false, managedPublished: true },
    want: "managed",
  },
  {
    name: "managed but unpublished (public fetch omits it) → static fallback",
    input: { hidden: false, managedPublished: false },
    want: "static",
  },
];

let failed = 0;
for (const test of cases) {
  const got = resolvePublicPresence(test.input);
  if (got !== test.want) {
    failed += 1;
    console.error(`FAIL ${test.name}: got ${got}, want ${test.want}`);
  } else {
    console.log(`ok   ${test.name}`);
  }
}

if (failed) {
  console.error(`\n${failed} public presence test(s) failed`);
  process.exit(1);
}
console.log(`\n${cases.length} public presence tests passed`);
