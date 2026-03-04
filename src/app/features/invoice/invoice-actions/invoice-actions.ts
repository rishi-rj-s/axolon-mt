import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice-actions',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './invoice-actions.html',
  styleUrl: './invoice-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceActions {
  save = output<void>();
  clear = output<void>();
  private router = inject(Router);

  onClose() {
    this.router.navigate(['/login']);
  }
}
