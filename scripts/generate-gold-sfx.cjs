const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 1.22;
const samples = Math.floor(sampleRate * duration);
const notes = [880, 1108.73, 1318.51, 1760, 2217.46];
const starts = [0, .115, .245, .39, .56];
const data = Buffer.alloc(samples * 2);

for (let i = 0; i < samples; i += 1) {
  const time = i / sampleRate;
  let value = 0;
  for (let n = 0; n < notes.length; n += 1) {
    const local = time - starts[n];
    if (local < 0 || local > .48) continue;
    const attack = Math.min(1, local / .008);
    const decay = Math.exp(-local * (7.3 + n * .45));
    const shimmer = Math.sin(2 * Math.PI * notes[n] * local) + .32 * Math.sin(2 * Math.PI * notes[n] * 2.01 * local);
    value += shimmer * attack * decay * (.34 - n * .025);
  }
  const tail = Math.max(0, time - .56);
  if (tail > 0 && tail < .56) value += Math.sin(2 * Math.PI * 2637 * tail) * Math.exp(-tail * 8.8) * .16;
  const softened = Math.tanh(value * 1.15) * .72;
  data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(softened * 32767))), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);

const target = path.join(__dirname, '..', 'assets', 'gold-reward-v1.wav');
fs.writeFileSync(target, Buffer.concat([header, data]));
console.log(`Generated ${target}`);
