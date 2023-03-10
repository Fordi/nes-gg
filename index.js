const SYMBOLS = { to: [...'APZLGITYEOXUKSVN'], from: {} };
SYMBOLS.to.forEach((c, i) => SYMBOLS.from[c] = i);
// Combine nibbles into larger numbers by list of indices into array r
const num = (r, ...l) => l.reduce((s, i) => (s << 4) | r[i], 0);
// Convert a number to nibbles.  c is the number of desired nibbles.
const toNibs = (n, c) => new Array(c).fill().map((_, i) => (n >> ((c - i - 1) << 2)) & 0xF);
export const decode = (code) => {
  const c = code.toUpperCase().replace(/\s+/g, '');
  const is6 = c.length === 6;
  if (!(c.length === 8 || is6) || /[^APZLGITYEOXUKSVN]/.test(c)) {
    throw new Error(`Entered code '${code}' is not an NES Game Genie code`);
  }
  const r = [...c]
    // Convert from letters to nibbles; the high bit of nibble 2 is ignored.
    .map((s, i) => SYMBOLS.from[s] | (i === 2 ? 8 : 0))
    // Convolute:
    // We're taking the high bit of each nibble and combining it with the 
    // lower three bits of the next, wrapping around the array. So
    //  0123 4567 8910 abcd efgh ijkl becomes
    //  0567 4910 8bcd afgh ejkl i123
    // Works the same way for 6 or 8 letter codes.
    .map((v, i, a) => (v & 8) | (a[(i + 1) % a.length] & 7));

  return {
    // Address is the same for both code variants
    address: num(r, 2, 4, 1, 3),
    // Data is always the first and last nibble
    data: num(r, 0, r.length - 1),
    ...(!is6 && { compare: num(r, 6, 5) })
  };
};

export const encode = ({ address, data, compare }) => {
  if (address < 0x8000) {
    throw new Error('Cannot create an NES Game Genie code that dives below $8000');
  }
  const is6 = compare === undefined;
  // Convert our real values to an array of nibbles
  let r = [...toNibs(address, 4), ...toNibs(data, 2), ...toNibs(compare, is6 ? 0 : 2)];
  // rearrange into the GG order
  return [
       // Commented numbering is big-endian
    4, // data 1
    2, // address 1
    0, // address 3
    3, // address 0
    1, // address 2
    ...(is6 ? [] : [7, 6]), // compare 0 and 1, if present
    5, // data 0
  ].map(i => r[i])
    // convolute (see decoder; this is the reverse of that, 
    //  swapping in the three bits of the previous nibble, wrapping)
    .map((v, i, a) => (v & 8) | (a[(i + a.length - 1) % a.length] & 7))
    // convert to symbols
    .map(s => SYMBOLS.to[s])
    // and to a string
    .join('');
};
