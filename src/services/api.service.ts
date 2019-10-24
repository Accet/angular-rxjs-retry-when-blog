import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  getData() {
    return this.httpClient.get("/data");
  }

  getNextInvoice(month: number) {
    return this.httpClient.get("/invoice", {
      params: new HttpParams().set("month", `${month}`)
    });
  }
}
