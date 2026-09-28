import { readFile, writeFile } from "node:fs/promises";

const path = "android/app/src/main/AndroidManifest.xml";

const permissions = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.VIBRATE",
  "android.permission.WAKE_LOCK",
];

let xml = await readFile(path, "utf8");

for (const name of permissions) {
  if (xml.includes(name)) {
    console.log(`${name} already present`);
    continue;
  }
  const line = `    <uses-permission android:name="${name}" />\n`;
  const next = xml.replace(/(<manifest[^>]*>\n)/, `$1${line}`);
  if (next === xml) {
    throw new Error(`Could not insert ${name} into ${path}`);
  }
  xml = next;
  console.log(`Added ${name}`);
}

// Ensure the application tag allows cleartext only if missing usesCleartextTraffic —
// HTTPS CDN does not need it, but some package mirrors might. Prefer not forcing cleartext.
if (!xml.includes("android:usesCleartextTraffic")) {
  // no-op: keep default (false) for security; packages use HTTPS.
  console.log("Leaving usesCleartextTraffic at platform default (HTTPS-only).");
}

await writeFile(path, xml);
console.log("AndroidManifest permissions patched.");
