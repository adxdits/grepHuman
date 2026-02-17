import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ChromeApiService } from '../../../../core/services';

@Component({
  selector: 'app-popup-container',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="shell">
      <!-- Header -->
      <mat-toolbar class="toolbar">
        <img src="icons/logoSquare.png" alt="logo" class="logo" />
        <span class="title">grepHuman</span>
      </mat-toolbar>

      @if (!isGoogleSearch()) {
        <!-- Not on Google -->
        <div class="empty-state">
          <mat-icon class="empty-icon">travel_explore</mat-icon>
          <p class="empty-title">Not a Google search page</p>
          <p class="empty-hint">Open a Google search to see AI labels on results.</p>
        </div>
      } @else {
        <!-- Controls -->
        <div class="body">
          <section class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-label">AI Labels</span>
                <span class="row-desc">Tag each result as human or AI</span>
              </div>
              <mat-slide-toggle
                [checked]="labelsEnabled()"
                (change)="toggleLabels($event.checked)" />
            </div>

            <mat-divider />

            <div class="row">
              <div class="row-text">
                <span class="row-label">Hide AI results</span>
                <span class="row-desc">Remove AI & slop from the page</span>
              </div>
              <button
                mat-icon-button
                [disabled]="!labelsEnabled()"
                (click)="hideAIResults()">
                <mat-icon>visibility_off</mat-icon>
              </button>
            </div>
          </section>

          @if (hiddenCount() > 0) {
            <section class="card hidden-banner">
              <mat-icon class="banner-icon">filter_list_off</mat-icon>
              <span class="banner-text">{{ hiddenCount() }} result{{ hiddenCount() === 1 ? '' : 's' }} hidden</span>
              <button mat-button class="banner-action" (click)="showAllResults()">
                Show all
              </button>
            </section>
          }

          <div class="legend">
            <span class="legend-item">
              <span class="dot green"></span> Not AI
            </span>
            <span class="legend-item">
              <span class="dot orange"></span> Maybe AI
            </span>
            <span class="legend-item">
              <span class="dot red"></span> AI Slop
            </span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .shell {
      width: 340px;
      min-height: 260px;
      display: flex;
      flex-direction: column;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }

    /* ── Header ────────────────────────────── */
    .toolbar {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      height: 52px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo {
      width: 26px;
      height: 26px;
      border-radius: 4px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    /* ── Empty state ───────────────────────── */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-outline);
      margin-bottom: 12px;
    }

    .empty-title {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 500;
    }

    .empty-hint {
      margin: 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Body ──────────────────────────────── */
    .body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ── Card ──────────────────────────────── */
    .card {
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      overflow: hidden;
    }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      gap: 12px;
    }

    .row-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .row-label {
      font-size: 14px;
      font-weight: 500;
    }

    .row-desc {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Hidden banner ─────────────────────── */
    .hidden-banner {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      gap: 8px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .banner-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .banner-text {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
    }

    .banner-action {
      --mdc-text-button-label-text-color: var(--mat-sys-on-error-container);
      min-width: 0;
      padding: 0 8px;
      font-size: 13px;
    }

    /* ── Legend ─────────────────────────────── */
    .legend {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 4px 0 2px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot.green  { background: #10b981; }
    .dot.orange { background: #f59e0b; }
    .dot.red    { background: #ef4444; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupContainerComponent implements OnInit {
  private readonly chromeApi = inject(ChromeApiService);

  readonly isGoogleSearch = signal(false);
  readonly labelsEnabled = signal(true);
  readonly hiddenCount = signal(0);

  ngOnInit(): void {
    this.checkIfGoogleSearch();
  }

  async checkIfGoogleSearch(): Promise<void> {
    const tab = await this.chromeApi.getCurrentTab();
    if (tab?.url) {
      const isGoogle = tab.url.includes('google.') && tab.url.includes('/search');
      this.isGoogleSearch.set(isGoogle);

      if (isGoogle && tab.id) {
        // Get current state from content script
        const response = await this.chromeApi.sendMessageToTab<{
          labelsEnabled?: boolean;
          hiddenCount?: number;
        }>(tab.id, { type: 'GET_STATE' });
        if (response) {
          this.labelsEnabled.set(response.labelsEnabled ?? true);
          this.hiddenCount.set(response.hiddenCount ?? 0);
        }
      }
    }
  }

  async toggleLabels(enabled: boolean): Promise<void> {
    this.labelsEnabled.set(enabled);
    const tab = await this.chromeApi.getCurrentTab();
    if (tab?.id) {
      await this.chromeApi.sendMessageToTab(tab.id, {
        type: 'TOGGLE_LABELS',
        enabled
      });
    }
  }

  async hideAIResults(): Promise<void> {
    const tab = await this.chromeApi.getCurrentTab();
    if (tab?.id) {
      const response = await this.chromeApi.sendMessageToTab<{
        hiddenCount?: number;
      }>(tab.id, {
        type: 'HIDE_AI_RESULTS'
      });
      if (response?.hiddenCount !== undefined) {
        this.hiddenCount.set(response.hiddenCount);
      }
    }
  }

  async showAllResults(): Promise<void> {
    const tab = await this.chromeApi.getCurrentTab();
    if (tab?.id) {
      await this.chromeApi.sendMessageToTab(tab.id, {
        type: 'SHOW_ALL_RESULTS'
      });
      this.hiddenCount.set(0);
    }
  }
}
