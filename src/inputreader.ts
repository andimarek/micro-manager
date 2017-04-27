import { ReadStream, WriteStream } from "tty";
import { find, filter } from 'lodash';
import { blue } from 'chalk';
import { readFile, writeFile } from './util';
import { MicroManagerBaseDir } from './constants';
import { log } from './log';


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

class Line {
  curColumn: number;
  public content: string;

  constructor() {
    this.curColumn = 1;
  }

  newCommandLine(predefined?: string) {
    // stdout.write(LF);
    stdout.write(blue('>'));
    if (predefined) {
      stdout.write(predefined);
      this.curColumn = predefined.length + 2;
      this.content = predefined;
    } else {
      this.curColumn = 2;
      this.content = '';
    }
  }

  clear() {
    this.curColumn = 1;
    this.content = '';
  }

  write(toPrint: string) {
    stdin.write(toPrint);
    this.content += toPrint;
    this.curColumn += toPrint.length;
  }

  replaceCurrenteLine(newLine: string) {
    this.clearLine(2);
    this.curColumn = 2;
    this.write(newLine);
  }

  currentValue(): string {
    return this.content;
  }

  backspace() {
    if (this.content.length === 0) return;
    this.content = this.content.substr(0, this.content.length - 1);
    this.clearLine(this.curColumn - 1);
    this.curColumn--;
  }

  private clearLine(startingFrom: number) {
    process.stdout.write(`\u001b[${startingFrom}G`);
    process.stdout.write('\u001b[K');
  }

}

const CR = '\r';
const LF = '\n';
const BACKSPACE = '\u007F'
const CTRL_C = '\u0003';
const BS = '\u0008';
const TAB = '\t';
const ARROW_UP_ENCODED = '%1B%5BA';
const ARROW_DOWN_ENCODED = '%1B%5BB';
const historyFile = `${MicroManagerBaseDir}/history.json`;

type Processor = (chunk: string) => void;
let currentProcessor: Processor = lineProcessor;

let commands: Command[];
let history: string[];

const line = new Line();

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
    history.push('help');
    printHelp();
    return Promise.resolve();
  }
  const command = getCommand(parts[0]);
  if (command) {
    history.push(command.name);
    return command.execute(parts.slice(1));
  } else {
    console.log(`🤷  unknown command ${parts[0]} ... use 'help' to get the available commands`);
    return Promise.resolve();
  }
}


function getPossibleCommands(startingWith: string): Command[] {
  const result = filter(commands, (command) => command.name.startsWith(startingWith));
  return result;
}

function completionHelp() {
  const possibleCommands = getPossibleCommands(line.content);
  if (possibleCommands.length === 0) return;
  if (possibleCommands.length === 1) {
    const name = possibleCommands[0].name;
    const whatIsLeft = name.length - line.content.length;
    if (whatIsLeft > 0) {
      line.write(name.substr(line.content.length));
    }
    return;
  }
  stdout.write(LF);
  possibleCommands.forEach(command => {
    stdout.write(command.name);
    stdout.write(LF);
  });
  line.newCommandLine(line.content);
}

function lineProcessor(chunk: string): void {
  if (chunk === CR || chunk == LF) {
    stdout.write('\n');
    handleLine(line.content).then(() => {
      line.newCommandLine();
    });
  } else if (chunk === BACKSPACE) {
    line.backspace();
  } else if (chunk === TAB) {
    completionHelp();
  } else if (encodeURI(chunk) === ARROW_UP_ENCODED) {
    if (history.length > 0) {
      line.replaceCurrenteLine(history[history.length - 1]);
    }

  } else if (encodeURI(chunk) === ARROW_DOWN_ENCODED) {

  } else {
    line.write(chunk);
  }
  // console.log('1:', encodeURI(chunk));
  if (chunk === CTRL_C) {
    stop();
  }

}

export function start(): Promise<any> {
  return readFile(historyFile, [])
    .then((savedHistory) => {
      log(`history: `, savedHistory);
      history = savedHistory;
    })
    .then(() => {
      line.newCommandLine();
      stdin.on('data', (chunk: string) => {
        currentProcessor(chunk);
      });
    });
}
export function stop(): Promise<void> {
  return writeFile(historyFile, history).then(() => {
    log('\n👋  Goodbye');
    process.exit(0);
  });
}