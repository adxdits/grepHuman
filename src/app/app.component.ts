import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';

interface FeatureItem {
  icon: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = signal('grepHuman');
  clickCount = signal(0);
  showFeatures = signal(false);

  features = signal<FeatureItem[]>([
    { icon: '⚡', label: 'Angular 21' },
    { icon: '🎯', label: 'Control Flow' },
    { icon: '📦', label: 'Signals' }
  ]);

  message = computed(() => {
    const count = this.clickCount();
    return count === 0
      ? 'Click the button to get started!'
      : `You clicked ${count} time${count > 1 ? 's' : ''}!`;
  });

  incrementCount(): void {
    this.clickCount.update(count => count + 1);
  }

  toggleFeatures(): void {
    this.showFeatures.update(show => !show);
  }
}
