import { Component, ChangeDetectionStrategy, input, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormBuilder, AbstractControl } from '@angular/forms';
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
export class InvoiceLineItems implements OnInit {
  items = input.required<FormArray>();

  tableData: AbstractControl[] = [];
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.syncTableData();
    this.items().valueChanges.subscribe(() => {
      if (this.tableData.length !== this.items().length) {
        this.syncTableData();
        this.cdr.markForCheck();
      }
    });
  }

  syncTableData() {
    this.tableData = [...this.items().controls];
    this.cdr.detectChanges();
  }

  get emptyGridRows() {
    // Always show a fixed number of empty padding rows after the data + add-row.
    // This ensures the table always has visual grid lines and data rows grow the table.
    const fixedPaddingRows = 10;
    return new Array(fixedPaddingRows).fill(0);
  }

  private dataService = inject(MockDataService);
  private fb = inject(FormBuilder);

  itemList$ = this.dataService.getItems();

  onAddRow() {
    this.items().push(this.fb.group({
      rowNumber: [1],
      itemCode: [''],
      description: [''],
      unit: [''],
      quantity: [1],
      price: [0],
      amount: [{ value: 0, disabled: true }],
      expense: [{ value: 0, disabled: true }]
    }));
    this.updateRowNumbers();
    this.syncTableData();
  }

  onRemoveRow(index: number) {
    this.items().removeAt(index);
    this.updateRowNumbers();
    this.syncTableData();
  }

  private updateRowNumbers() {
    this.items().controls.forEach((ctrl, i) => {
      ctrl.get('rowNumber')?.setValue(i + 1, { emitEvent: false });
    });
  }

  updateAmount(index: number) {
    const row = this.items().at(index);
    let qty = row.get('quantity')?.value;
    let price = row.get('price')?.value;
    
    qty = typeof qty === 'number' ? qty : (Number(qty?.value) || Number(qty) || 0);
    price = typeof price === 'number' ? price : (Number(price?.value) || Number(price) || 0);

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
    this.syncTableData();
  }

  get totalQuantity(): number {
    return this.items().controls.reduce((sum, row) => {
      const val = row.get('quantity')?.value;
      return sum + (typeof val === 'number' ? val : (Number(val?.value) || Number(val) || 0));
    }, 0);
  }

  get totalAmount(): number {
    return this.items().controls.reduce((sum, row) => {
      const val = row.get('amount')?.value;
      return sum + (typeof val === 'number' ? val : (Number(val?.value) || Number(val) || 0));
    }, 0);
  }

  get totalExpense(): number {
    return this.items().controls.reduce((sum, row) => {
      const val = row.getRawValue().expense; // getting raw value to bypass disabled object nesting
      return sum + (typeof val === 'number' ? val : (Number(val?.value) || Number(val) || 0));
    }, 0);
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
