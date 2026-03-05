import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Vendor, Item, TaxGroup, Currency, Invoice } from '@models/invoice.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private http = inject(HttpClient);

  getVendors(): Observable<Vendor[]> {
    return of([
      { id: '210101A0007', code: '210101A0007', name: 'ABDUL MALIK', address: 'Dubai, UAE' },
      { id: '210101A0008', code: '210101A0008', name: 'ALI & SONS', address: 'Abu Dhabi, UAE' },
    ]);
  }

  getItems(): Observable<Item[]> {
    return of([
      { code: '010101040009', description: 'AGGREGATE', unit: 'MT', defaultPrice: 6.00 },
      { code: '010102010008', description: 'CARRO JOINT TILE GROUT CJS 60', unit: 'BAG', defaultPrice: 3.50 },
      { code: '010102050001', description: 'MASTERTİLE 30 WHITE', unit: 'BAG', defaultPrice: 14.00 },
      { code: '010102060004', description: 'NEOFIL WATERPROOF LATEX MODIFIED TILE ADHESIVE', unit: 'BAG', defaultPrice: 5.00 },
      { code: '020202010111', description: 'CEMENT SRC', unit: 'BAG', defaultPrice: 12.00 }
    ]);
  }

  getTaxGroups(): Observable<TaxGroup[]> {
    return of([
      { code: 'TAX01', name: '5% VAT', rate: 0.05 },
      { code: 'TAX02', name: '0% Zero Rated', rate: 0.00 },
      { code: 'TAX03', name: 'Exempt', rate: 0.00 },
    ]);
  }

  getCurrencies(): Observable<Currency[]> {
    return of([
      { code: 'AED', name: 'UAE Dirham', exchangeRate: 1.00 },
      { code: 'USD', name: 'US Dollar', exchangeRate: 3.67 },
      { code: 'EUR', name: 'Euro', exchangeRate: 4.10 },
    ]);
  }

  getDocIds(): Observable<string[]> {
    return of(['IMPI', 'DOMI', 'EXP1']);
  }

  getPaymentTerms(): Observable<string[]> {
    return of(['P-10003', 'NET30', 'NET60', 'CASH']);
  }
  
  getBuyers(): Observable<string[]> {
    return of(['System', 'Admin', 'User1']);
  }

  getShippingMethods(): Observable<string[]> {
    return of(['Land', 'Sea', 'Air', 'Courier']);
  }

  getDefaultInvoice(): Observable<Invoice> {
    return this.http.get<Invoice>('assets/defaults/invoice-defaults.json');
  }

  saveInvoice(invoice: Invoice): Observable<any> {
    // In actual use, this calls the backend for saving the invoice
    return this.http.post('http://url:port/save', invoice);
  }
}
