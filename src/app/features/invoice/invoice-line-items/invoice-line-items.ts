import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';

@Component({
  selector: 'app-invoice-line-items',
  standalone: true,
  imports: [ReactiveFormsModule, TableModule, InputTextModule, ButtonModule, SelectModule, CommonModule, InputNumberModule],
  templateUrl: './invoice-line-items.html',
  styleUrl: './invoice-line-items.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceLineItems {
  items = input.required<FormArray>();
  private dataService = inject(MockDataService);
  private fb = inject(FormBuilder);

  itemList$ = this.dataService.getItems();

  onAddRow() {
    const newIdx = this.items().length + 1;
    this.items().push(this.fb.group({
      rowNumber: [newIdx],
      itemCode: [''],
      description: [''],
      unit: [''],
      quantity: [1],
      price: [0],
      amount: [{ value: 0 }], // Disabled not strictly necessary if read-only in UI, but keeps recalculation active
      expense: [{ value: 0, disabled: true }]
    }));
  }

  onRemoveRow(index: number) {
    this.items().removeAt(index);
    this.updateRowNumbers();
  }

  private updateRowNumbers() {
    this.items().controls.forEach((ctrl, i) => {
      ctrl.get('rowNumber')?.setValue(i + 1, { emitEvent: false });
    });
  }

  updateAmount(index: number) {
    const row = this.items().at(index);
    const qty = row.get('quantity')?.value || 0;
    const price = row.get('price')?.value || 0;
    row.get('amount')?.setValue(qty * price);
  }

  onItemSelection(itemData: any, index: number) {
    if(!itemData) return;
    const row = this.items().at(index);
    row.patchValue({
      description: itemData.description,
      unit: itemData.unit,
      price: itemData.defaultPrice,
      itemCode: itemData.code
    });
    this.updateAmount(index);
  }
}
