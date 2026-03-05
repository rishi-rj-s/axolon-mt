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
        amount: [{ value: item.amount, disabled: true }],
        expense: [{ value: item.expense, disabled: true }]
      }));
    });
  }

  private setupReactiveCalculations() {
    // 1. Listen to Line Items (Updates Subtotal)
    this.lineItemsArray.valueChanges.subscribe(() => {
      const items = this.lineItemsArray.getRawValue();
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      this.invoiceForm.get('summary.subtotal')?.setValue(subtotal, { emitEvent: false });
      
      // Keep the discount amount in sync if the subtotal changes
      const currentPercent = this.invoiceForm.get('summary.discountPercent')?.value || 0;
      const newDiscountAmt = subtotal * (currentPercent / 100);
      this.invoiceForm.get('summary.discountAmount')?.setValue(newDiscountAmt, { emitEvent: false });

      this.recalculateTotal();
    });

    // 2. Bidirectional Discount: Typing PERCENT updates AMOUNT
    this.invoiceForm.get('summary.discountPercent')?.valueChanges.subscribe((percent) => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const amount = subtotal * ((percent || 0) / 100);
      this.invoiceForm.get('summary.discountAmount')?.setValue(amount, { emitEvent: false });
      this.recalculateTotal();
    });

    // 3. Bidirectional Discount: Typing AMOUNT updates PERCENT
    this.invoiceForm.get('summary.discountAmount')?.valueChanges.subscribe((amount) => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const percent = subtotal > 0 ? ((amount || 0) / subtotal) * 100 : 0;
      this.invoiceForm.get('summary.discountPercent')?.setValue(percent, { emitEvent: false });
      this.recalculateTotal();
    });

    // 4. Listen for manual typed edits to the tax field
    this.invoiceForm.get('summary.tax')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });

    // 5. Auto-calculate tax when the Tax Group dropdown changes
    this.invoiceForm.get('header.taxGroup')?.valueChanges.subscribe(() => {
      const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
      const discountAmount = this.invoiceForm.get('summary.discountAmount')?.value || 0;
      const taxGroup = this.invoiceForm.get('header.taxGroup')?.value;

      const taxRate = taxGroup === 'TAX01' ? 0.05 : 0;

      // Setting this will automatically trigger the tax valueChanges listener above
      this.invoiceForm.get('summary.tax')?.setValue((subtotal - discountAmount) * taxRate);
    });

    // 6. Listen to Expense edits
    this.invoiceForm.get('summary.totalExpense')?.valueChanges.subscribe(() => {
      this.recalculateTotal(); // Update final total to include expense
      this.distributeExpense(); // Distribute expense across line items
    });
  }

  private recalculateTotal() {
    const subtotal = this.invoiceForm.get('summary.subtotal')?.value || 0;
    // Read the directly typed/synced values instead of doing inline math
    const discountAmount = this.invoiceForm.get('summary.discountAmount')?.value || 0;
    const taxAmount = this.invoiceForm.get('summary.tax')?.value || 0;
    const totalExpense = this.invoiceForm.get('summary.totalExpense')?.value || 0;

    // Grand total includes subtotal, subtracts discount, adds tax and adds total expense
    const total = subtotal - discountAmount + taxAmount + totalExpense;

    this.invoiceForm.patchValue({
      summary: { total } 
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