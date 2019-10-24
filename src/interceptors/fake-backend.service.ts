import { Injectable } from "@angular/core";
import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { delay, dematerialize, materialize, mergeMap } from "rxjs/operators";

export interface InvoiceResponse {
  invoices?: number[];
  dueDate?: Date;
  error?: any;
}
// https://jasonwatmore.com/post/2019/05/02/angular-7-mock-backend-example-for-backendless-development
@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  // 0 - error thrown; 1 - successful result
  respMap = [0, 0, 0, 1];

  invoiceRespMap: InvoiceResponse[] = [
    { invoices: [], dueDate: new Date(2019, 9, 12) },
    { invoices: [], dueDate: new Date(2019, 10, 12) },
    { invoices: [], dueDate: new Date(2019, 11, 12) },
    { invoices: [100], dueDate: new Date(2020, 0, 12) }
  ];

  handleRoute(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const { url, method, body, params } = req;
    if (url.endsWith("/data") && method === "GET") {
      // Next is just a simulation of server responses:
      if (this.respMap.length) {
        const nextItem = this.respMap.shift();
        return nextItem !== 0 ? this.data(nextItem) : this.error(nextItem);
      } else {
        return next.handle(req);
      }
      // ==> Handling /invoices route:
    } else if (url.endsWith("/invoice") && method === "GET") {
      return this.invoiceRespMap.length
        ? this.data(
            this.invoiceRespMap.find(
              el => el.dueDate.getMonth() === parseInt(params.get("month"))
            )
          )
        : next.handle(req);
    } else {
      return next.handle(req);
    }
  }

  data(val) {
    return this.ok(val);
  }
  ok(body?) {
    return of(new HttpResponse({ status: 200, body }));
  }
  error(err) {
    return throwError(err);
  }
  constructor() {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return (
      of(null)
        .pipe(mergeMap(() => this.handleRoute(req, next)))
        // call materialize and dematerialize to ensure delay even if an error is thrown
        // (https://github.com/Reactive-Extensions/RxJS/issues/648)
        .pipe(materialize())
        .pipe(delay(500))
        .pipe(dematerialize())
    );
  }
}

export const fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};
