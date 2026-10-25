/**
 * CloudCLI plugin host API types.
 *
 * These describe the object the CloudCLI host passes to your plugin's mount()
 * function. Copy this file into your own plugin to get type-safety and editor
 * autocomplete; the values are supplied by the host at runtime.
 */

/** Which surface of the host mounted the plugin. */
export type PluginSurface =
  /** Inside the plugin's own workspace tab, mounted only while that tab is open. */
  | 'tab'
  /** In the resident plugin layer, mounted for the whole app session. */
  | 'resident'
  /** As a page of the settings dialog, mounted only while that page is shown. */
  | 'settings';

/** Application context the host publishes to a plugin. */
export type PluginContext = {
  /** Active UI theme. */
  theme: 'dark' | 'light';
  /** Currently selected workspace, or null when none is selected. */
  project: { name: string; path: string } | null;
  /** Currently active session, or null when none is selected. */
  session: { id: string; title: string } | null;
  /** Which surface mounted this instance, so one bundle can serve both. */
  surface: PluginSurface;
};

/** The API object received in mount(container, host). */
export type PluginHostApi = {
  /** Current context snapshot; always returns the latest values. */
  readonly context: PluginContext;

  /**
   * Subscribes to context changes (theme, workspace, session).
   * @returns An unsubscribe function.
   */
  onContextChange(callback: (context: PluginContext) => void): () => void;

  /**
   * Calls the plugin's own backend server through the host proxy.
   * @param method HTTP method (GET, POST, PUT, DELETE, ...)
   * @param path Request path on the plugin server (a leading "/" is optional)
   * @param body Optional JSON-serializable request body
   * @returns Parsed JSON response from the plugin server
   */
  rpc(method: string, path: string, body?: unknown): Promise<unknown>;
};

/** Shape this plugin's entry module satisfies. */
export type PluginModule = {
  mount(container: HTMLElement, host: PluginHostApi): void | Promise<void>;
  unmount?(container: HTMLElement): void;
};
