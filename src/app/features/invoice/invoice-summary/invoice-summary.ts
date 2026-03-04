import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [ReactiveFormsModule, InputNumberModule, CommonModule],
  templateUrl: './invoice-summary.html',
  styleUrl: './invoice-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSummary {
  form = input.required<FormGroup>();
}
