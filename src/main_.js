const stdin = process.stdin;
stdin.setEncoding('utf8');
stdin.setRawMode(true);

stdin.on('readable', () => {
  console.log('readable');
  var chunk = process.stdin.read();
  if (chunk == null) {
    return;
  }
  if (chunk !== null) {
    console.log('1:', encodeURI(chunk.charAt(0)));
  }
  if (chunk === '\n' || chunk == '\u0003' || chunk == '\u0004') {
    process.exit(0);
  }
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});
// stdin.on('keypress', (arg) => {
//   console.log(`keypress: ${arg}`);
// });

process.stdin.on('end', () => {
  process.stdout.write('end');
});

console.log('finished eval');