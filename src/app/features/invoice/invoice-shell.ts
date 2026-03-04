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
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
    TextareaModule,
    InvoiceHeader,
    InvoiceLineItems,
    InvoiceSummary,
    InvoiceToolbar,
    InvoiceActions
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
      voucherNumber: [{ value: '', disabled: true }],
      date: [new Date(), Validators.required],
      vendorId: ['', Validators.required],
      vendorName: [{ value: '', disabled: true }],
      reference: [''],
      reference2: [''],
      buyer: [''],
      shippingMethod: [''],
      paymentTerm: [''],
      taxGroup: [''],
      currency: [''],
      exchangeRate: [1],
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
        docId: data.docId,
        voucherNumber: data.voucherNumber,
        date: new Date(data.date),
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        reference: data.reference,
        reference2: data.reference2,
        buyer: data.buyer,
        shippingMethod: data.shippingMethod,
        paymentTerm: data.paymentTerm,
        taxGroup: data.taxGroup,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        dueDate: new Date(data.dueDate),
        vendorRef: data.vendorRef
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
        itemCode: [item.itemCode],
        description: [item.description],
        unit: [item.unit],
        quantity: [item.quantity],
        price: [item.price],
        amount: [item.amount],
        expense: [{ value: item.expense, disabled: true }]
      }));
    });
  }

  private setupReactiveCalculations() {
    this.lineItemsArray.valueChanges.subscribe(items => {
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      this.invoiceForm.get('summary.subtotal')?.setValue(subtotal, { emitEvent: false });
      this.recalculateTotal();
    });

    this.invoiceForm.get('summary.discountPercent')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });

    this.invoiceForm.get('header.taxGroup')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });

    this.invoiceForm.get('summary.totalExpense')?.valueChanges.subscribe(() => {
      this.distributeExpense();
    });
  }

  private recalculateTotal() {
    const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
    const discountPercent = this.invoiceForm.get('summary.discountPercent')?.value || 0;
    const taxGroup = this.invoiceForm.get('header.taxGroup')?.value; // Simplify tax to 5% if TAX01

    const discountAmount = subtotal * (discountPercent / 100);
    const taxRate = taxGroup === 'TAX01' ? 0.05 : 0;
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;

    this.invoiceForm.patchValue({
      summary: { discountAmount, tax: taxAmount, total }
    }, { emitEvent: false });

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
        // Last row gets the remainder to avoid rounding issues
        expense = totalExpense - distributed;
      } else {
        expense = Number(((amount / subtotal) * totalExpense).toFixed(2));
        distributed += expense;
      }

      ctrl.get('expense')?.setValue(Number(expense.toFixed(2)), { emitEvent: false });
    });
  }

  onSave() {
    if (this.invoiceForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Form is invalid. Please complete required fields.' });
      return;
    }

    const payload = this.invoiceForm.getRawValue();
    this.dataService.saveInvoice(payload as unknown as Invoice).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
      },
      error: (err) => {
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
}
