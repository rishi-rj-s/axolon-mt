import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';

@Component({
  selector: 'app-invoice-header',
  standalone: true,
  imports: [ReactiveFormsModule, SelectModule, DatePickerModule, InputTextModule, CommonModule],
  templateUrl: './invoice-header.html',
  styleUrl: './invoice-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceHeader {
  form = input.required<FormGroup>();
  private dataService = inject(MockDataService);

  vendors$ = this.dataService.getVendors();
  taxGroups$ = this.dataService.getTaxGroups();
  currencies$ = this.dataService.getCurrencies();
  buyers$ = this.dataService.getBuyers();
  methods$ = this.dataService.getShippingMethods();
  terms$ = this.dataService.getPaymentTerms();
}
