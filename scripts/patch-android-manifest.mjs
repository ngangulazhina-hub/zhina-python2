import { readFile, writeFile } from "node:fs/promises";

const path = "android/app/src/main/AndroidManifest.xml";
const permission = '    <uses-permission android:name="android.permission.VIBRATE" />\n';

const xml = await readFile(path, "utf8");

if (xml.includes("android.permission.VIBRATE")) {
  console.log("VIBRATE permission already present, nothing to patch.");
} else {
  const patched = xml.replace(/(<manifest[^>]*>\n)/, `$1${permission}`);
  if (patched === xml) {
    throw new Error(`Could not find an insertion point in ${path} — its <manifest> tag may have moved.`);
  }
  await writeFile(path, patched);
  console.log("Added android.permission.VIBRATE to AndroidManifest.xml");
}
