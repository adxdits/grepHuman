import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PopupContainerComponent } from './features/popup/containers/popup-container/popup-container.component';

/**
 * Root application component
 * Renders the popup container for the Chrome extension
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PopupContainerComponent],
  template: `<app-popup-container />`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
