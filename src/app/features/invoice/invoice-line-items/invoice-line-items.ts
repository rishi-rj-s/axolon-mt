import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';
import { take } from 'rxjs';

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

  get emptyGridRows() {
    // Fills grid out up to a hard stop of 10 rows. 
    // Further height natively converts into scrollbars via PrimeNG.
    const minimumGridSkeletons = 10;
    return new Array(Math.max(0, minimumGridSkeletons - this.items().length)).fill(0);
  }

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

  sortState = { field: null as string | null, order: 1 };

  getSortIcon(field: string): string {
    if (this.sortState.field === field) {
      return this.sortState.order === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down';
    }
    return 'pi-filter';
  }

  toggleSort(field: string) {
    if (this.sortState.field === field) {
      if (this.sortState.order === 1) {
        this.sortState.order = -1;
      } else {
        this.sortState.field = null;
        this.sortState.order = 1;
      }
    } else {
      this.sortState.field = field;
      this.sortState.order = 1;
    }
    this.applySort();
  }

  applySort() {
    const controlsArray = [...this.items().controls];
    
    if (!this.sortState.field) {
      controlsArray.sort((a, b) => {
        const val1 = a.get('rowNumber')?.value || 0;
        const val2 = b.get('rowNumber')?.value || 0;
        return val1 - val2;
      });
    } else {
      const sortField = this.sortState.field.replace('value.', '');
      const sortOrder = this.sortState.order;
      
      controlsArray.sort((a, b) => {
        const val1 = a.get(sortField)?.value;
        const val2 = b.get(sortField)?.value;
        
        let result = 0;
        if (val1 == null && val2 != null) result = -1;
        else if (val1 != null && val2 == null) result = 1;
        else if (val1 == null && val2 == null) result = 0;
        else if (typeof val1 === 'string' && typeof val2 === 'string') {
          result = val1.localeCompare(val2);
        } else {
          result = (val1 < val2) ? -1 : (val1 > val2) ? 1 : 0;
        }
        return result * sortOrder;
      });
    }

    while (this.items().length !== 0) {
      this.items().removeAt(0);
    }
    controlsArray.forEach(ctrl => this.items().push(ctrl));
  }

  onItemCodeChange(event: Event, index: number) {
    const code = (event.target as HTMLInputElement).value;
    if (!code) return;
    
    this.itemList$.pipe(take(1)).subscribe(items => {
      const itemData = items.find(i => i.code === code);
      if (itemData) {
        const row = this.items().at(index);
        row.patchValue({
          description: itemData.description,
          unit: itemData.unit,
          price: itemData.defaultPrice,
          itemCode: itemData.code
        });
        this.updateAmount(index);
      }
    });
  }
}
