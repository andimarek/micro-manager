import { executeCommand, executeCommandInShell } from './util';
import { log } from './log';
import { assertTrue } from './assert';
import * as S from 'string';

export interface Dependency {
  groupId: string;
  artifactId: string;
  version: string;
}

export interface Configuration {
  name: string;
  desc: string;
  dependencies: Dependency[];
}

export function getDependencies(path: string): Promise<Configuration[]> {
  return executeCommand('./gradlew', ['dependencies'], path).then((result) => {
    return parse(result);
  });
}

function parse(output: string): Configuration[] {
  const lines = output.split('\n');
  const startIx = searchForStart(lines);
  let curIx = startIx;
  const result: Configuration[] = [];
  while (curIx < lines.length && lines[curIx] !== 'BUILD SUCCESSFUL') {
    if (lines[curIx] === '') {
      curIx++;
      continue;
    }
    const [configuration, parsedLines] = parseConfiguration(lines, curIx);
    // log.debu('configuration: ', configuration);
    result.push(configuration);
    curIx += parsedLines;
  }
  return result;
}

function searchForStart(lines: string[]): number {
  let curIx = 0;
  while (curIx < lines.length && !S(lines[curIx]).startsWith('---------------------------')) {
    curIx++;
  }
  assertTrue(curIx < lines.length, `unexptected format`);
  return curIx + 3;
}

function parseConfiguration(lines: string[], curIx: number): [Configuration, number] {
  const header = lines[curIx];
  const parts = header.split(' - ');
  assertTrue(parts.length === 2, `unexpected configuration header format: ${header} in line index ${curIx}`);
  const configuration = {
    name: parts[0],
    desc: parts[1],
    dependencies: []
  };
  const parsedLines = parseDependenciesForOneConfiguration(lines, curIx + 1, configuration);
  return [configuration, parsedLines + 1];
}

function parseDependenciesForOneConfiguration(lines: string[], startIx: number, configuration: Configuration): number {
  let curIx = startIx;
  while (curIx < lines.length && lines[curIx]) {
    const curLine = lines[curIx];
    if (curLine === 'No dependencies') {
      return 2;
    }
    const start = curLine.indexOf('- ');
    assertTrue(start > 0, `unexpected format ${curLine} ... no start`);
    const optionalSpace = curLine.indexOf(' ', start + 2);
    const end = optionalSpace > -1 ? optionalSpace : curLine.length;
    assertTrue(end > 0 && start < end, `unexpected format ${curLine} ... no end`);
    configuration.dependencies.push(parseDependency(curLine.substring(start + 2, end)));
    curIx++;
  }
  return curIx - startIx;
}

function parseDependency(toParse: string): Dependency {
  const parts = toParse.split(':');
  assertTrue(parts.length === 3, `unexpected dependency format: ${toParse}`);
  return {
    groupId: parts[0],
    artifactId: parts[1],
    version: parts[2]
  };
}