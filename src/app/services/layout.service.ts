import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  readonly isSidenavOpen = signal(true);

  toggleSidenav(): void {
    this.isSidenavOpen.update((v) => !v);
  }

  setSidenavOpen(isOpen: boolean): void {
    this.isSidenavOpen.set(isOpen);
  }
}
