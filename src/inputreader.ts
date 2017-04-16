import { ReadStream } from "tty";
import {find} from 'lodash';

export interface InputReader {
  onCancel(): void;
  onLine(line: string): void;
  onCommand(): void;
}

export interface Command {
  name: string;
  arguments: CommandArgument[];
  execute: (args:string[]) => void;
}
export interface CommandArgument {
  name: string;
}

const CR = '\r';
const LF = '\n';
const BACKSPACE = '\u007F'
const CTRL_C = '\u0003';
const BS = '\u0008';

type Processor = (chunk: string ) => void;
let currentProcessor: Processor = lineProcessor;

let currentLine = '';
let curColumn = 1;
// let reader: InputReader;
let commands: Command[];

/**
 * Init
 */

if (!process.stdin.isTTY) {
  throw new Error('stdin is not TTY');
}
const stdin = <ReadStream>process.stdin;
stdin.setEncoding('utf8');
stdin.setRawMode(true);

export function setCommands(_commands: Command[]) {
  commands = _commands;
}

function getCommand(name: string): Command | undefined {
  return find(commands, (command) => command.name === name);
}

function handleLine(line: string) {
  const parts = line.split(" ");
  const command = getCommand(parts[0]);
  if (command) {
    command.execute(parts.slice(1));
  } else {
    console.log(`unknown command ${parts[0]}`);
  }
}

function lineProcessor(chunk: string): void {
  if (chunk === CR || chunk == LF) {
    process.stdout.write('\n');
    handleLine(currentLine);
    currentLine = '';
    curColumn = 1;
  } else if (chunk === BACKSPACE) {
    currentLine = currentLine.substr(0, currentLine.length - 1);
    // process.stdout.write('\u0011');
    process.stdout.write(`\u001b[${curColumn - 1}G`);
    process.stdout.write('\u001b[K');
    curColumn--;
    // process.stdout.write('\u007F');

    // process.stdout.write('\t');
  } else {
    currentLine += chunk;
    curColumn++;
    process.stdout.write(chunk);
  }

  // console.log('1:', encodeURI(chunk));

  if (chunk === CTRL_C) {
    // reader.onCancel();
    process.exit(0);
  }

}


stdin.on('data', (chunk: string) => {
  currentProcessor(chunk);
});

// export function readInput(reader: InputReader) {

// }

// export function readOptions(values: string[]) {
// }