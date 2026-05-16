import * as vscode from "vscode";
import { getAliases } from "./config";
import { scanDocument, DocumentComponentInfo } from "./parser";

/**
 * Workspace-wide component index. Scans every `.lua`/`.luau` file in the
 * project once, then keeps itself fresh via the file-system watcher and the
 * onDidChangeTextDocument event (so unsaved buffers are reflected).
 *
 * Lookups are name-based: the first matching component in the index wins.
 * If multiple files declare a component with the same identifier, this is
 * a best-effort guess (cross-file `require` resolution would be needed for
 * full precision and is a documented limitation).
 */
export class WorkspaceIndex implements vscode.Disposable {
  private cache = new Map<
    string,
    { components: Map<string, DocumentComponentInfo> }
  >();
  private warmupPromise: Promise<void>;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.warmupPromise = this.warmup().catch(() => {});

    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{lua,luau}"
    );
    this.disposables.push(
      watcher,
      watcher.onDidChange((uri) => {
        this.scanUri(uri).catch(() => {});
      }),
      watcher.onDidCreate((uri) => {
        this.scanUri(uri).catch(() => {});
      }),
      watcher.onDidDelete((uri) => {
        this.cache.delete(uri.toString());
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        const langId = e.document.languageId;
        if (langId === "lua" || langId === "luau") {
          this.scanDocument(e.document);
        }
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration("reactLuauPropsHelper.createElementAliases")
        ) {
          this.cache.clear();
          this.warmupPromise = this.warmup().catch(() => {});
        }
      })
    );
  }

  private async warmup(): Promise<void> {
    const files = await vscode.workspace.findFiles("**/*.{lua,luau}");
    await Promise.all(
      files.map((uri) => this.scanUri(uri).catch(() => undefined))
    );
  }

  private async scanUri(uri: vscode.Uri): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(uri);
    this.scanDocument(doc);
  }

  private scanDocument(doc: vscode.TextDocument): void {
    const aliases = getAliases();
    const components = scanDocument(doc.getText(), aliases);
    this.cache.set(doc.uri.toString(), { components });
  }

  /**
   * Returns the first match for `componentName` across the workspace,
   * preferring files other than `excludeUri` (typically the file the user
   * is editing — its own contents have already been searched by the
   * same-file inference pass).
   */
  async findComponent(
    componentName: string,
    excludeUri?: string
  ): Promise<DocumentComponentInfo | undefined> {
    await this.warmupPromise;
    for (const [uriString, entry] of this.cache) {
      if (uriString === excludeUri) {
        continue;
      }
      const found = entry.components.get(componentName);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  /**
   * Like findComponent, but returns the URI of the defining file alongside
   * the parsed info. Used by auto-import to locate the file to import from.
   */
  async findComponentFile(
    componentName: string,
    excludeUri?: string
  ): Promise<{ uri: vscode.Uri; info: DocumentComponentInfo } | undefined> {
    await this.warmupPromise;
    const lastSegment = componentName.split(".").pop() ?? componentName;
    for (const [uriString, entry] of this.cache) {
      if (uriString === excludeUri) {
        continue;
      }
      const found = entry.components.get(lastSegment);
      if (found) {
        return { uri: vscode.Uri.parse(uriString), info: found };
      }
    }
    return undefined;
  }

  /**
   * For tests: directly seed the cache with parsed component info.
   */
  _seedForTesting(
    entries: Array<[string, Map<string, DocumentComponentInfo>]>
  ): void {
    for (const [uriString, components] of entries) {
      this.cache.set(uriString, { components });
    }
    this.warmupPromise = Promise.resolve();
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
