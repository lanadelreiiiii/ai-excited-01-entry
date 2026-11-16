// ai-excited-01 entry (Node 22, standard library only): the image is the
// entry.png beside this file, and the program copies it to /output/entry.png.
// The gate takes a whole PNG or JPEG of at most 1 MiB and 1024 by 1024
// pixels, and the judge sees exactly the bytes copied. The copy is fully
// deterministic: running this program twice produces byte-identical output.
//
// Before copying, the program validates the entry against the gate's limits
// (file exists, PNG or JPEG magic bytes, at most 1 MiB, PNG dimensions at
// most 1024 by 1024) and fails with a clear error instead of handing the
// grader a bad file. After copying, it reads the output back and compares
// every byte with the input, so a truncated or corrupted copy can never
// pass silently.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

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

let format;
let dimensions = null;

if (input.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
  format = 'PNG';
  // PNG IHDR chunk: width and height are big-endian uint32 at bytes 16-23.
  if (input.length < 24 || input.toString('ascii', 12, 16) !== 'IHDR') {
    fail('entry.png has a PNG signature but no IHDR chunk');
  }
  const width = input.readUInt32BE(16);
  const height = input.readUInt32BE(20);
  dimensions = `${width}x${height}`;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    fail(`entry.png is ${width}x${height}, over the 1024x1024 gate limit`);
  }
} else if (input.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) {
  format = 'JPEG';
  // JPEG dimensions live in the first SOF0/SOF1/SOF2 segment: scan markers
  // (FF xx + 2-byte length) until one is found; SOS means image data, so
  // no SOF can follow it.
  let offset = 2;
  while (offset + 9 <= input.length) {
    if (input[offset] !== 0xff) {
      fail('entry.png has corrupt JPEG marker data');
    }
    const marker = input[offset + 1];
    if (marker === 0xda) {
      break; // SOS: start of scan, no SOF after this
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2; // standalone marker, no length field
      continue;
    }
    const length = input.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > input.length) {
      fail('entry.png has a truncated JPEG segment');
    }
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = input.readUInt16BE(offset + 5);
      const width = input.readUInt16BE(offset + 7);
      dimensions = `${width}x${height}`;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        fail(`entry.png is ${width}x${height}, over the 1024x1024 gate limit`);
      }
      break;
    }
    offset += 2 + length;
  }
  if (dimensions === null) {
    fail('entry.png has a JPEG signature but no SOF segment');
  }
} else {
  fail('entry.png is neither PNG nor JPEG (unrecognised magic bytes)');
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outputPath = join(outputDir, 'entry.png');

mkdirSync(outputDir, { recursive: true });
copyFileSync(inputPath, outputPath);

const output = readFileSync(outputPath);
if (!output.equals(input)) {
  fail(`output at ${outputPath} does not match entry.png byte for byte`);
}

process.stderr.write(
  `ai-excited-01 entry: wrote ${format}${dimensions ? ` ${dimensions}` : ''} ` +
  `${input.length} bytes to ${outputPath} (verified byte-identical)\n`,
);
