import { log } from './log';
import { parseString } from 'xml2js';
import * as fs from 'fs';
import { forEach } from 'lodash';
import { Project } from './domain';

function parsePomXml(file: string) {
  // const pomFile = <string>fs.readFileSync('./test/example-service/pom2.xml', 'utf-8');
  const pomFile = <string>fs.readFileSync(file, 'utf-8');
  parseString(pomFile, (err, result) => {
    const json = JSON.stringify(result);
    const dependencies = result.project.dependencies[0].dependency;

    forEach(dependencies, (dep, key) => {});
  });
}
