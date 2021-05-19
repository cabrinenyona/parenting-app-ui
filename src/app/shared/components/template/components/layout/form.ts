import { Component, OnInit, ViewChild, ViewChildren } from "@angular/core";
import { TemplateBaseComponent } from "../base";
import { Plugins } from "@capacitor/core";
import { getBooleanParamFromTemplateRow } from "src/app/shared/utils";

const { Device } = Plugins;

@Component({
  selector: "plh-tmpl-form",
  template: ` <div>
    <plh-template-component
      *ngFor="let childRow of _row.rows; let idx = index"
      [row]="childRow"
      [parent]="parent"
    >
    </plh-template-component>
    <ion-button style="width: 100%; margin-top: 20px;" (click)="submit()">Submit</ion-button>
  </div>`,
})
export class FormComponent extends TemplateBaseComponent implements OnInit {
  private deviceInfo;
  private form = {};
  private isAllowedDeviceInfo: boolean;

  constructor() {
    super();
    this.deviceInfo = Device.getInfo();
  }

  ngOnInit() {
    this.getParams();
  }

  public submit(): void {
    this.fillInForm();
    console.log(this.form);
  }

  private getParams(): void {
    this.isAllowedDeviceInfo = getBooleanParamFromTemplateRow(this._row, "get_device_info", false);
  }

  private fillInForm(): void {
    this._row.rows.forEach((r) => {
      if (
        r.value &&
        (r.type === "text_box" || r.type === "simple_checkbox" || r.type === "text_area")
      ) {
        this.form[r.name] = r.value;
      }
    });
    if (this.isAllowedDeviceInfo) {
      this.form["device_info"] = this.deviceInfo["__zone_symbol__value"];
    }
  }
}