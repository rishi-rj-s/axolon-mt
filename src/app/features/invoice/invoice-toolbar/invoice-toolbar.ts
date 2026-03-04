import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-invoice-toolbar',
  standalone: true,
  imports: [ButtonModule, ToolbarModule],
  templateUrl: './invoice-toolbar.html',
  styleUrl: './invoice-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceToolbar {
  // We mock the outputs for nav events since logic isn't connected to db navigation
  first = output<void>();
  prev = output<void>();
  next = output<void>();
  last = output<void>();
}
