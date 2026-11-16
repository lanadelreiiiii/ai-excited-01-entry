// ai-excited-01 entry (Node 22, standard library only).
//
// The entry is the image in entry.png beside this file. The program copies
// it to /output/entry.png, which is exactly what the judge sees. The copy
// is deterministic: running this program twice produces byte-identical
// output, because the bytes come straight from the input file.
//
// Before copying, the program validates the entry against the gate limits
// (the file must exist and be non-empty, it must be a PNG or JPEG, at most
// 1 MiB, and at most 1024 by 1024 pixels) and fails with a clear error
// instead of handing the grader a bad file. After copying, it reads the
// output back, compares every byte with the input, and re-parses the
// output's format and dimensions to prove they match the input's, so a
// truncated, corrupted or silently rewritten copy can never pass.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Pass --check to validate the entry without writing anything:
//   node main.ts --check

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1024 * 1024; // gate limit: at most 1 MiB
const MAX_DIMENSION = 1024; // gate limit: at most 1024 by 1024 pixels

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function fail(message) {
  throw new Error(`ai-excited-01 entry: ${message}`);
}

// Detect the format from the magic bytes and read the dimensions, checking
// them against the gate limits. `label` is only used in error messages so
// the same routine can validate both the input and the copied output.
function parseImage(buffer, label) {
  let format;
  let dimensions = null;

  if (buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    format = 'PNG';
    // PNG IHDR chunk: width and height are big-endian uint32 at bytes
    // 16-23, and the chunk type at bytes 12-15 must read IHDR.
    if (buffer.length < 24 || buffer.toString('ascii', 12, 16) !== 'IHDR') {
      fail(`${label} has a PNG signature but no IHDR chunk`);
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    dimensions = `${width}x${height}`;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      fail(`${label} is ${width}x${height}, over the 1024x1024 gate limit`);
    }
  } else if (buffer.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) {
    format = 'JPEG';
    // JPEG dimensions live in the first SOF0, SOF1 or SOF2 segment. Walk
    // the markers (FF xx followed by a 2-byte length) until one is found.
    // SOS (0xDA) starts the compressed image data, so no SOF can follow it.
    let offset = 2;
    while (offset + 9 <= buffer.length) {
      if (buffer[offset] !== 0xff) {
        fail(`${label} has corrupt JPEG marker data`);
      }
      const marker = buffer[offset + 1];
      if (marker === 0xda) {
        break; // SOS: start of scan, nothing to read after this
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2; // standalone marker, no length field
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > buffer.length) {
        fail(`${label} has a truncated JPEG segment`);
      }
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        // SOF layout: length(2) precision(1) height(2) width(2).
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        dimensions = `${width}x${height}`;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          fail(`${label} is ${width}x${height}, over the 1024x1024 gate limit`);
        }
        break;
      }
      offset += 2 + length;
    }
    if (dimensions === null) {
      fail(`${label} has a JPEG signature but no SOF segment`);
    }
  } else {
    fail(`${label} is neither PNG nor JPEG (unrecognised magic bytes)`);
  }

  return { format, dimensions };
}

const inputPath = fileURLToPath(new URL('./entry.png', import.meta.url));

if (!existsSync(inputPath)) {
  fail(`entry.png not found at ${inputPath}`);
}

const input = readFileSync(inputPath);

if (input.length === 0) {
  fail('entry.png is empty');
}

if (input.length > MAX_BYTES) {
  fail(`entry.png is ${input.length} bytes, over the 1 MiB gate limit`);
}

const { format, dimensions } = parseImage(input, 'entry.png');

const checkOnly = process.argv.includes('--check');
if (checkOnly) {
  // Dry-run mode: validation above already passed, so report the verdict
  // and stop before touching the filesystem.
  process.stderr.write(
    `ai-excited-01 entry: check passed — ${format}${dimensions ? ` ${dimensions}` : ''} ` +
    `${input.length} bytes, within the gate limits (no output written)\n`,
  );
  process.exit(0);
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outputPath = join(outputDir, 'entry.png');

mkdirSync(outputDir, { recursive: true });
copyFileSync(inputPath, outputPath);

const output = readFileSync(outputPath);
if (!output.equals(input)) {
  fail(`output at ${outputPath} does not match entry.png byte for byte`);
}

// The byte comparison above already proves the copy is exact, but re-parse
// the output as an image too: its format and dimensions must be the same
// as the input's, so a copy that somehow rewrote the image data is caught
// even if the byte count happened to match.
const outImage = parseImage(output, outputPath);
if (outImage.format !== format || outImage.dimensions !== dimensions) {
  fail(`output at ${outputPath} is ${outImage.format} ${outImage.dimensions}, ` +
    `expected ${format} ${dimensions}`);
}

process.stderr.write(
  `ai-excited-01 entry: wrote ${format}${dimensions ? ` ${dimensions}` : ''} ` +
  `${input.length} bytes to ${outputPath} (verified byte-identical)\n`,
);
