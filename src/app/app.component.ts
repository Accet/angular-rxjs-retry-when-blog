import { Component, OnInit } from "@angular/core";
import { concat, Observable, of, throwError } from "rxjs";
import {
  catchError,
  concatMap,
  delay,
  map,
  retryWhen,
  switchMap,
  take,
  tap
} from "rxjs/operators";
import { ApiService } from "../services/api.service";
import { InvoiceResponse } from "../interceptors/fake-backend.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  constructor(private apiService: ApiService) {}
  output = [];
  ngOnInit(): void {}
  // handleClick() {}
  // Let's repeat the call when we have an error:
  // handleClick() {
  //   this.apiService
  //     .getData()
  //     .pipe(
  //       take(1),
  //       // Next for presentational purposes;
  //       // We want too display the error output alongside with successful result
  //       catchError(err => {
  //         this.output.push(err);
  //         return throwError(err);
  //       }),
  //       retryWhen(result =>
  //         result.pipe(
  //           concatMap(result => {
  //             // here we can check the error.
  //             // We can specify the retry only if we are getting 5xx errors for instance.
  //             if (result === 0) {
  //               return of(result);
  //             }
  //             // in other cases we throw an error down the pipe
  //             return throwError(result);
  //           }),
  //           delay(1000),
  //           // we can keep calling forever but usually we want to avoid this.
  //           // So, we set the number of attempts including the initial one.
  //           take(3),
  //           o =>
  //             concat(
  //               o,
  //               throwError(`Sorry, there was no result after 3 retries)`)
  //             )
  //         )
  //       ),
  //       tap(result => this.output.push(result))
  //     )
  //     .subscribe(() => {}, error => this.output.push(error));
  // }

  // Let's assume that we need to fetch an in voice for the upcoming period. Our server generates invoices for the next unpaid period respectively.
  // There is a chance that a user already has payed for the next month, so our server will return no invoices in successful response.
  // However, we can keep calling the endpoint until we get the month where the invoice won't be payed yet and we can display it with right due date.
  // To achieve this we need to perform some changes to our handleClick() method and to adapt our fake server.

  // Now we can achieve scanning of the url by replacing url params if result doesn't satisfy us:
  handleClick() {
    this.getInvoiceFromAPI(new Date())
      .pipe(
        take(1),
        // checking the response object for invoice items.
        // if there are no invoices throw an error to re-fetch them:
        tap(response => {
          if (!response.invoices.length) {
            this.output.push(`Empty month ${response.dueDate.getMonth() + 1}`);
            throw response;
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error we stop trying and pass the error down
            tap(invoiceItemsResult => {
              if (invoiceItemsResult.error) {
                throw invoiceItemsResult.error;
              }
            }),
            delay(300),
            // we can keep calling forever but usually we want to avoid this.
            // So, we set the number of attempts including the initial one.
            take(3),
            // Attach an error message after we exceed number of attempts:
            o => concat(o, throwError(`Sorry, there was no result after 3 attempts)`))
          )
        ),
        tap(result => this.output.push(result.invoices.join(" ,")))
      )
      .subscribe(() => {}, error => this.output.push(error));
  }

  getInvoiceFromAPI(date: Date): Observable<InvoiceResponse> {
    let retryAttempt = 0;
    let dateCopy = new Date(date);
    // Important to wrap main call into the parent observable:
    return of(null).pipe(
      concatMap(() => {
        // Add next month for each retry:
        let newDate = new Date(
          dateCopy.setMonth(date.getMonth() + retryAttempt++)
        );
        return this.apiService.getNextInvoice(newDate.getMonth());
      }),
      // mapping error response to the object that will help us to decide whether retry the call or not:
      catchError(err => of({ error: err }))
    );
  }
}
