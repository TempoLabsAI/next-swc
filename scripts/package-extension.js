const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const distPath = path.join(__dirname, "..", "dist");
const outputPath = path.join(__dirname, "..", "ai-tutor-extension.zip");

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver("zip", {
  zlib: { level: 9 }, // Sets the compression level
});

// Listen for all archive data to be written
output.on("close", function () {
  console.log("✅ Extension packaged successfully!");
  console.log(`📦 Package size: ${archive.pointer()} bytes`);
  console.log(`📁 Location: ${outputPath}`);
  console.log("\n🚀 Ready to install in Chrome:");
  console.log("1. Open Chrome and go to chrome://extensions/");
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the dist folder');
  console.log("\nOr install the packaged extension:");
  console.log("1. Drag and drop the .zip file into chrome://extensions/");
});

// Handle warnings
archive.on("warning", function (err) {
  if (err.code === "ENOENT") {
    console.warn("Warning:", err);
  } else {
    throw err;
  }
});

// Handle errors
archive.on("error", function (err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the dist directory to the archive
if (fs.existsSync(distPath)) {
  archive.directory(distPath, false);
  archive.finalize();
} else {
  console.error(
    '❌ Build directory not found. Run "npm run build:extension" first.',
  );
  process.exit(1);
}
