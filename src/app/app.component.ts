import { Component, OnInit } from "@angular/core";
import { from, Observable, of, throwError } from "rxjs";
import { catchError, concatMap, delay, take, tap } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  output = [];
  respMap = [0, 0, 0, 1]; // 0 - error thrown; 1 - successful result
  constructor() {}

  ngOnInit(): void {}

  fakeAPICall(params: number): Observable<any> {
    return from(this.respMap).pipe(
      delay(500),
      concatMap(res => {
        this.respMap.shift();
        if (!res) {
          return throwError(res);
        } else {
          return of(res);
        }
      })
    );
  }

  handleClick() {
    this.fakeAPICall(1)
      .pipe(
        take(1),
        tap(result => this.output.push(result)),
        catchError(err => {
          this.output.push(err);
          return throwError(err);
        })
      )
      .subscribe();
  }
}
