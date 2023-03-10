#!/bin/env node
import { encode, decode } from './index.js';
import { basename } from 'path';
const args = process.argv.slice(2);
const commands = [];
const emit = (spec, code) => {
  const { address, data, compare } = spec;
  const out = [
    `Code: ${code}`,
    `  Address: ${address.toString(16).padStart(4, '0').toUpperCase()}`,
    `  Data: ${data.toString(16).padStart(2, '0').toUpperCase()}`
  ];
  if (compare !== undefined) {
    out.push(`  Compare: ${compare.toString(16).padStart(2, '0').toUpperCase()}`);
  }
  console.log(out.join('\n'));
};

const usage = () => console.log([
  `Encode and decode NES Game Genie codes`,
  `Usage: ${basename(process.argv[1])} [d GGCODE] [e address,data[,compare]] [h|-h|--help]`,
  `d GGCODE                 Decode an NES Game Genie code`,
  `e address,data[,compare] Create an NES Game Genie code`,
  'h|-h|--help              This help message' 
].join('\n'));

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === 'd') {
    const code = args[++i];
    commands.push(() => emit(decode(code), code));
    continue;
  }
  if (arg === 'e') {
    const [address, data, compare] = args[++i].split(',').map(a => parseInt(a.trim(), 16));
    const spec = { address, data, compare };
    commands.push(() => emit(spec, encode(spec)));
    continue;
  }
  usage();
  process.exit();
}
if (commands.length === 0) usage();
commands.forEach(cmd => cmd());