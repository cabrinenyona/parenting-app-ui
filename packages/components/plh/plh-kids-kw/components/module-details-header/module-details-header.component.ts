import { Component, OnInit } from "@angular/core";
import { TemplateBaseComponent } from "src/app/shared/components/template/components/base";
import { TemplateTranslateService } from "src/app/shared/components/template/services/template-translate.service";
import { getStringParamFromTemplateRow } from "src/app/shared/utils";

interface IModuleHeaderParams {
  backgroundImageAsset?: string;
  moduleImageAsset?: string;
}
@Component({
  selector: "plh-module-details-header",
  templateUrl: "./module-details-header.component.html",
  styleUrls: ["./module-details-header.component.scss"],
})
export class PlhModuleDetailsHeaderComponent extends TemplateBaseComponent implements OnInit {
  params: Partial<IModuleHeaderParams> = {};

  constructor(public templateTranslateService: TemplateTranslateService) {
    super();
  }

  ngOnInit() {
    this.getParams();
  }

  private getParams() {
    this.params.backgroundImageAsset = getStringParamFromTemplateRow(
      this._row,
      "background_image_asset",
      null
    );
    this.params.moduleImageAsset = getStringParamFromTemplateRow(
      this._row,
      "module_image_asset",
      null
    );
  }
}
