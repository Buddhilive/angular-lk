import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    duration: 3000,
  };

  /**
   * Show success message
   */
  success(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-success'],
    });
  }

  /**
   * Show error message
   */
  error(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-error'],
    });
  }

  /**
   * Show warning message
   */
  warning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-warning'],
    });
  }

  /**
   * Show info message
   */
  info(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-info'],
    });
  }
}
