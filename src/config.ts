import * as vscode from "vscode";
import { DEFAULT_ALIASES } from "./data";

export function getAliases(): string[] {
  const config = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  const fromConfig = config.get<string[]>(
    "createElementAliases",
    DEFAULT_ALIASES
  );
  if (!Array.isArray(fromConfig) || fromConfig.length === 0) {
    return DEFAULT_ALIASES;
  }
  return fromConfig;
}

export interface AutoImportAlias {
  filesystemPath: string;
  robloxPath: string;
}

export interface AutoImportConfig {
  enabled: boolean;
  style: "relative" | "alias";
  aliases: AutoImportAlias[];
}

export function getAutoImportConfig(): AutoImportConfig {
  const cfg = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  return {
    enabled: cfg.get<boolean>("autoImport.enabled", false),
    style: cfg.get<"relative" | "alias">(
      "autoImport.style",
      "relative"
    ),
    aliases: cfg.get<AutoImportAlias[]>("autoImport.aliases", []) ?? [],
  };
}
