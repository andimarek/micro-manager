import { ReadStream, WriteStream } from "tty";
import { find, filter } from 'lodash';
import { blue } from 'chalk';
import * as S from 'string';

export interface InputReader {
  onCancel(): void;
  onLine(line: string): void;
  onCommand(): void;
}

export interface Command {
  name: string;
  arguments: CommandArgument[];
  execute: (args: string[]) => Promise<void>;
}
export interface CommandArgument {
  name: string;
}

const CR = '\r';
const LF = '\n';
const BACKSPACE = '\u007F'
const CTRL_C = '\u0003';
const BS = '\u0008';
const TAB = '\t';

type Processor = (chunk: string) => void;
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

if (!process.stdout.isTTY) {
  throw new Error('stdout is not TTY');
}

const stdin = <ReadStream>process.stdin;
stdin.setEncoding('utf8');
stdin.setRawMode(true);
const stdout = <WriteStream>process.stdout;


export function setCommands(_commands: Command[]) {
  commands = _commands;
}

function getCommand(name: string): Command | undefined {
  return find(commands, (command) => command.name === name);
}

function printHelp() {
  stdout.write(LF);
  stdout.write('available commands:');
  stdout.write(LF);
  commands.forEach(command => {
    stdout.write(command.name);
    stdout.write(LF);
  });
}

function handleLine(line: string): Promise<any> {
  const parts = line.split(" ");
  if (parts[0] === 'help') {
    printHelp();
    return Promise.resolve();
  }
  const command = getCommand(parts[0]);
  if (command) {
    return command.execute(parts.slice(1));
  } else {
    console.log(`🤷  unknown command ${parts[0]} ... use 'help' to get the available commands`);
    return Promise.resolve();
  }
}

function newLine() {
  stdout.write(blue('>'));
  curColumn++;
}

function getPossibleCommands(startingWith: string): Command[] {
  const result = filter(commands, (command) => S(command.name).startsWith(startingWith));
  // if(S('help').startsWith(startingWith) {
  //   result.push()
  // }
  return result;
}

function completionHelp() {
  const possibleCommands = getPossibleCommands(currentLine);
  if (possibleCommands.length === 0) return;
  if (possibleCommands.length === 1) {
    const name = possibleCommands[0].name;
    const whatIsLeft = name.length - currentLine.length;
    if (whatIsLeft > 0) {
      stdout.write(name.substr(currentLine.length));
    }
    currentLine = name;
    curColumn = name.length + 2;
    return;
  }
  stdout.write(LF);
  possibleCommands.forEach(command => {
    stdout.write(command.name);
    stdout.write(LF);
  });
  stdout.write(blue('>'));
  stdout.write(currentLine);
}

function lineProcessor(chunk: string): void {
  if (chunk === CR || chunk == LF) {
    stdout.write('\n');
    handleLine(currentLine).then(() => {
      currentLine = '';
      curColumn = 1;
      newLine();
    });
  } else if (chunk === BACKSPACE) {
    if (currentLine.length > 0) {
      currentLine = currentLine.substr(0, currentLine.length - 1);
      process.stdout.write(`\u001b[${curColumn - 1}G`);
      process.stdout.write('\u001b[K');
      curColumn--;
    }
  } else if (chunk === TAB) {
    completionHelp();
  } else if (encodeURI(chunk) === '%1B%5BA' || encodeURI(chunk) === '%1B%5BB') {

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

export function start() {
  newLine();
  stdin.on('data', (chunk: string) => {
    currentProcessor(chunk);
  });
}