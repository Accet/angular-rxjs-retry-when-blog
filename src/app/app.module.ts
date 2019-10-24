import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { HttpClientModule } from "@angular/common/http";
import { fakeBackendProvider } from "../interceptors/fake-backend.service";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [fakeBackendProvider],
  bootstrap: [AppComponent]
})
export class AppModule {}
