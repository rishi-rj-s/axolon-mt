import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MockDataService } from '@core/services/mock-data.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { Invoice } from '@models/invoice.model';
import { take } from 'rxjs';

import { InvoiceActions } from './invoice-actions/invoice-actions';
import { InvoiceHeader } from './invoice-header/invoice-header';
import { InvoiceLineItems } from './invoice-line-items/invoice-line-items';
import { InvoiceSummary } from './invoice-summary/invoice-summary';
import { InvoiceToolbar } from './invoice-toolbar/invoice-toolbar';

@Component({
  selector: 'app-invoice-shell',
  standalone: true,
  imports: [
    ReactiveFormsModule, ToastModule, ConfirmDialogModule, TextareaModule,
    InvoiceHeader, InvoiceLineItems, InvoiceSummary, InvoiceToolbar, InvoiceActions
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './invoice-shell.html',
  styleUrl: './invoice-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceShell implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(MockDataService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  invoiceForm = this.fb.group({
    header: this.fb.group({
      docId: ['', Validators.required],
      voucherNumber: ['', Validators.required],
      date: [new Date(), Validators.required],
      vendorId: ['', Validators.required],
      vendorName: [{ value: '', disabled: true }],
      reference: [''],
      reference2: [''],
      buyer: ['', Validators.required],
      shippingMethod: ['', Validators.required],
      paymentTerm: ['', Validators.required],
      taxGroup: ['', Validators.required],
      currency: ['', Validators.required],
      exchangeRate: [1, Validators.required],
      dueDate: [new Date(), Validators.required],
      vendorRef: ['']
    }),
    lineItems: this.fb.array([], [Validators.required]),
    summary: this.fb.group({
      subtotal: [0],
      discountPercent: [0],
      discountAmount: [0],
      tax: [0],
      totalExpense: [0],
      total: [0],
      status: ['DRAFT']
    }),
    note: ['']
  });

  ngOnInit() {
    this.setupReactiveCalculations();
    this.loadDefaultData();
  }

  get lineItemsArray() {
    return this.invoiceForm.get('lineItems') as FormArray;
  }

  private loadDefaultData() {
    this.dataService.getDefaultInvoice().pipe(take(1)).subscribe(defaultData => {
      this.populateForm(defaultData);
    });
  }

  private populateForm(data: Invoice) {
    this.invoiceForm.patchValue({
      header: {
        ...data,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate)
      },
      summary: {
        subtotal: data.subtotal,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        tax: data.tax,
        totalExpense: data.totalExpense,
        total: data.total,
        status: data.status
      },
      note: data.note
    });

    this.lineItemsArray.clear();
    data.lineItems.forEach(item => {
      this.lineItemsArray.push(this.fb.group({
        rowNumber: [item.rowNumber],
        itemCode: [item.itemCode, Validators.required],
        description: [item.description, Validators.required],
        unit: [item.unit, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
        price: [item.price, [Validators.required, Validators.min(0)]],
        amount: [{ value: item.amount, disabled: true }],
        expense: [{ value: item.expense, disabled: true }]
      }));
    });
  }

  private setupReactiveCalculations() {
    this.invoiceForm.get('header.vendorId')?.valueChanges.subscribe(vendorId => {
      this.dataService.getVendors().pipe(take(1)).subscribe(vendors => {
        const vendor = vendors.find(v => v.id === vendorId);
        this.invoiceForm.get('header.vendorName')?.setValue(vendor ? vendor.name : '');
      });
    });

    this.lineItemsArray.valueChanges.subscribe(() => {
      const items = this.lineItemsArray.getRawValue();
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      this.invoiceForm.get('summary.subtotal')?.setValue(subtotal, { emitEvent: false });

      const currentPercent = this.invoiceForm.get('summary.discountPercent')?.value || 0;
      const newDiscountAmt = subtotal * (currentPercent / 100);
      this.invoiceForm.get('summary.discountAmount')?.setValue(newDiscountAmt, { emitEvent: false });
      this.recalculateTotal();
    });

    this.invoiceForm.get('summary.discountPercent')?.valueChanges.subscribe((percent) => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const amount = subtotal * ((percent || 0) / 100);
      this.invoiceForm.get('summary.discountAmount')?.setValue(amount, { emitEvent: false });
      this.recalculateTotal();
    });

    this.invoiceForm.get('summary.discountAmount')?.valueChanges.subscribe((amount) => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const percent = subtotal > 0 ? ((amount || 0) / subtotal) * 100 : 0;
      this.invoiceForm.get('summary.discountPercent')?.setValue(percent, { emitEvent: false });
      this.recalculateTotal();
    });

    this.invoiceForm.get('summary.tax')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });

    this.invoiceForm.get('header.taxGroup')?.valueChanges.subscribe(() => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const discountAmount = this.invoiceForm.get('summary.discountAmount')?.value || 0;
      const taxGroup = this.invoiceForm.get('header.taxGroup')?.value;
      const taxRate = taxGroup === 'TAX01' ? 0.05 : 0;
      this.invoiceForm.get('summary.tax')?.setValue((subtotal - discountAmount) * taxRate);
    });

    this.invoiceForm.get('summary.totalExpense')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
      this.distributeExpense();
    });

    this.invoiceForm.get('header.currency')?.valueChanges.subscribe(currencyCode => {
      if (currencyCode) {
        this.dataService.getCurrencies().pipe(take(1)).subscribe(currencies => {
          const selectedCurrency = currencies.find(c => c.code === currencyCode);
          if (selectedCurrency) {
            this.invoiceForm.get('header.exchangeRate')?.setValue(selectedCurrency.exchangeRate);
          }
        });
      }
    });
  }

  private recalculateTotal() {
    const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
    const discountAmount = this.invoiceForm.get('summary.discountAmount')?.value || 0;
    const taxAmount = this.invoiceForm.get('summary.tax')?.value || 0;
    const totalExpense = this.invoiceForm.get('summary.totalExpense')?.value || 0;

    const total = subtotal - discountAmount + taxAmount + totalExpense;
    this.invoiceForm.patchValue({ summary: { total } }, { emitEvent: false });
    this.distributeExpense();
  }

  private distributeExpense() {
    const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
    const totalExpense = this.invoiceForm.get('summary.totalExpense')?.value || 0;

    if (subtotal === 0) return;

    let distributed = 0;
    const controls = this.lineItemsArray.controls;

    controls.forEach((ctrl, index) => {
      const amount = ctrl.get('amount')?.value || 0;
      let expense = 0;

      if (index === controls.length - 1) {
        expense = totalExpense - distributed;
      } else {
        expense = Number(((amount / subtotal) * totalExpense).toFixed(2));
        distributed += expense;
      }
      ctrl.get('expense')?.setValue(Number(expense.toFixed(2)), { emitEvent: false });
    });
  }

  onSave() {
    this.invoiceForm.markAllAsTouched();
    this.invoiceForm.get('header.dueDate')?.setErrors(null);

    if (this.lineItemsArray.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You must add at least one item to the invoice.' });
      return;
    }

    const dateStr = this.invoiceForm.get('header.date')?.value;
    const dueDateStr = this.invoiceForm.get('header.dueDate')?.value;

    if (dateStr && dueDateStr) {
      const date = new Date(dateStr);
      const dueDate = new Date(dueDateStr);

      date.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < date) {
        this.invoiceForm.get('header.dueDate')?.setErrors({ invalidDate: true });
        this.messageService.add({ severity: 'error', summary: 'Invalid Date', detail: 'Due Date cannot be older than the Invoice Date.' });
        return;
      }
    }

    if (this.invoiceForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Incomplete', detail: 'Please fill in all required fields highlighted in red.' });
      return;
    }

    const rawForm = this.invoiceForm.getRawValue();
    const payload: Invoice = {
      ...rawForm.header,
      ...rawForm.summary,
      date: new Date(rawForm.header.date as any).toISOString(),
      dueDate: new Date(rawForm.header.dueDate as any).toISOString(),
      note: rawForm.note,
      lineItems: rawForm.lineItems
    } as unknown as Invoice;

    console.log('Saved Invoice JSON:', JSON.stringify(payload, null, 2));

    this.dataService.saveInvoice(payload).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save invoice.' });
      }
    });
  }

  onClear() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to clear the entire form?',
      accept: () => {
        this.invoiceForm.reset();
        this.lineItemsArray.clear();
      }
    });
  }

  onVoid() {
    this.confirmationService.confirm({
      header: 'Confirm Void',
      message: 'Are you sure you want to void this invoice? This will clear all items.',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.lineItemsArray.clear();
        this.messageService.add({
          severity: 'info', summary: 'Voided', detail: 'All line items have been removed.'
        });
      }
    });
  }
}