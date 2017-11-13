import * as vscode from "vscode";
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { MavenProjectTreeItem } from "./mavenProjectTreeItem";

export class Utils {
    private static terminals: { [id: string]: vscode.Terminal } = {};

    public static runInTerminal(command: string, addNewLine: boolean = true, terminal: string = "Maven"): void {
        if (this.terminals[terminal] === undefined) {
            this.terminals[terminal] = vscode.window.createTerminal(terminal);
        }
        this.terminals[terminal].show();
        this.terminals[terminal].sendText(command, addNewLine);
    }

    public static getPomXmlFilePaths(): string[] {
        const filename: string = 'pom.xml';
        const ret = [];
        const stdout = execSync(`find '${vscode.workspace.rootPath}' -name '${filename}'`);
        stdout.toString().split('\n').forEach(f => {
            if (f) {
                ret.push(f);
            }
        })
        return ret;
    }

    public static getProjects(pomXmlFilePath: string): MavenProjectTreeItem {
        if (fs.existsSync(pomXmlFilePath)) {
            execSync(`mvn help:effective-pom -f "${pomXmlFilePath}" -Doutput="${pomXmlFilePath}.effective"`);
            const xml = fs.readFileSync(`${pomXmlFilePath}.effective`, 'utf8');
            let obj = null;
            xml2js.parseString(xml, {explicitArray:false}, (err, res)=> {obj = res; console.log(obj)});
            if (obj && obj.project && obj.project.name) {
                return new MavenProjectTreeItem(obj.project.name, pomXmlFilePath);
            } 
            if (obj && obj.projects && obj.projects.project) {
                const projectNames = [];
                obj.projects.project.forEach( (project) => {
                    projectNames.push(project.name);
                });
                return new MavenProjectTreeItem(pomXmlFilePath, pomXmlFilePath, 'mavenProjects', projectNames);
                
            }
        }
        return null;
    }

    public static getProject(pomXmlRelativePath: string): MavenProjectTreeItem {
        const pomXmlFilePath = path.resolve(vscode.workspace.rootPath, pomXmlRelativePath);
        if (fs.existsSync(pomXmlFilePath)) {
            const xml = fs.readFileSync(pomXmlFilePath, 'utf8');
            let pomObject = null;
            xml2js.parseString(xml, {explicitArray:false}, (err, res)=> {pomObject = res; console.log(pomObject)});
            if (pomObject && pomObject.project && pomObject.project.name) {
                return new MavenProjectTreeItem(pomObject.project.name, pomXmlFilePath, "mavenProject", pomObject)
            }
        }
        return null;
    }

}