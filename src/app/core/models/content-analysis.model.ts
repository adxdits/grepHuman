/**
 * Chrome tab information
 */
export interface ChromeTabInfo {
  readonly id: number;
  readonly url: string;
  readonly title: string;
  readonly favIconUrl: string | null;
}
