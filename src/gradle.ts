import { executeCommand, executeCommandInShell, makePath } from './util';
import { log } from './log';
import { assertTrue } from './assert';
import * as S from 'string';
import { Project, GradleComplexType } from './domain';
import { isObject } from 'lodash';

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

export function getDependencies(projectPath: string, repoPath: string, project: Project): Promise<Configuration[]> {
  let gradlewPath: string;
  if (isObject(project.type)) {
    gradlewPath = makePath(repoPath, (<GradleComplexType>project.type)['gradlew-path'], 'gradlew');
    // log.debug('gradlepath with', gradlewPath, ' from ', projectPath, (<GradleComplexType>project.type)['gradlew-path'], 'gradlew');
  } else {
    gradlewPath = './gradlew';
  }
  return executeCommand(gradlewPath, ['dependencies'], projectPath).then((result) => {
    return parse(result);
  });
}

function parse(output: string): Configuration[] {
  log.debug('trying to parse:', output);
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
  assertTrue(parts.length == 1 || parts.length === 2, `unexpected configuration header format: ${header} in line index ${curIx}`);
  const configuration = {
    name: parts[0],
    desc: parts[1] || '',
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
    if (curLine.startsWith('Download ')) {
      curIx++;
      continue;
    }
    const start = curLine.indexOf('- ');
    assertTrue(start > 0, `unexpected format ${curLine} ... no start`);
    const optionalSpace = curLine.indexOf(' ', start + 2);
    const end = optionalSpace > -1 ? optionalSpace : curLine.length;
    assertTrue(end > 0 && start < end, `unexpected format ${curLine} ... no end`);
    const dependency = parseDependency(curLine.substring(start + 2, end));
    if (dependency) {
      configuration.dependencies.push(dependency);
      if (end > 0 && curLine.indexOf(' -> ', end) > 0) {
        const realVersionStart = curLine.indexOf(' -> ', end) + 4;
        const optionalRemark = curLine.indexOf(' (*)', realVersionStart);
        const realVersion = curLine.substring(realVersionStart, optionalRemark > 0 ? optionalRemark : curLine.length);
        const dependency = configuration.dependencies[configuration.dependencies.length - 1];
        log.debug(`replacing dependency version ${dependency.version} with real version ${realVersion}`);
        dependency.version = realVersion;
      }
    }
    curIx++;
  }
  return curIx - startIx;
}

function parseDependency(toParse: string): Dependency | null {
  if (toParse === 'project') {
    return null;
  }
  const parts = toParse.split(':');
  assertTrue(parts.length === 3, `unexpected dependency format: ${toParse}`);
  return {
    groupId: parts[0],
    artifactId: parts[1],
    version: parts[2]
  };
}