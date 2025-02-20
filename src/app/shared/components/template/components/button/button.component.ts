import { Component, ElementRef, OnInit } from "@angular/core";
import {
  getStringParamFromTemplateRow,
  getBooleanParamFromTemplateRow,
} from "src/app/shared/utils";
import { TemplateBaseComponent } from "../base";
import { TemplateTranslateService } from "../../services/template-translate.service";

interface IButtonParams {
  /** TEMPLATE PARAMETER: "variant" */
  variant:
    | "alternative"
    | "card"
    | "card-portrait"
    | "flexible"
    | "full"
    | "information"
    | "medium"
    | "navigation"
    | "short"
    | "standard"
    | "tall";
  /** TEMPLATE PARAMETER: "style". Legacy, use "variant" instead. */
  style: string;
  /** TEMPLATE PARAMETER: "disabled". If true, button is disabled and greyed out */
  disabled: boolean;
  /** TEMPLATE PARAMETER: "text_align" */
  textAlign: "left" | "centre" | "right";
  /** TEMPLATE PARAMETER: "button_align" */
  buttonAlign: "left" | "centre" | "right";
  /** TEMPLATE PARAMETER: "icon". The path to an icon asset. This will be displayed in the 'start' slot (left for LTR languages) */
  icon: string;
  /**
   * TEMPLATE PARAMETER: "icon_secondary_asset". The path to a secondary icon asset,
   * which will be displayed in the 'end' slot (right for LTR languages)
   * */
  iconSecondary: string;
  /** TEMPLATE PARAMETER: "image_asset". The path to an image asset */
  image: string;
  /** TEMPLATE PARAMETER: "icon_align". Aligns the Primary icon to the left or right */
  iconAlign: "left" | "right";
}

/**
 * A general-purpose button component
 */
@Component({
  selector: "plh-button",
  templateUrl: "./button.component.html",
  styleUrls: ["./button.component.scss"],
})
export class TmplButtonComponent extends TemplateBaseComponent implements OnInit {
  params: Partial<IButtonParams> = {};
  /** @ignore */
  variantMap: { cardPortrait: boolean };

  /** @ignore */
  constructor(
    private elRef: ElementRef,
    public templateTranslateService: TemplateTranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.getParams();
  }

  public handleClick() {
    if (this.params.disabled) return;
    this.triggerActions("click");
  }

  private getParams() {
    this.params.style = `${getStringParamFromTemplateRow(this._row, "style", "information")} ${
      this.isTwoColumns() ? "two_columns" : ""
    }` as any;
    this.params.variant = getStringParamFromTemplateRow(this._row, "variant", "")
      .split(",")
      .join(" ") as IButtonParams["variant"];
    this.populateVariantMap();
    this.params.disabled = getBooleanParamFromTemplateRow(this._row, "disabled", false);
    this.params.image = getStringParamFromTemplateRow(this._row, "image_asset", null);
    if (this._row.disabled) {
      this.params.disabled = true;
    }
    this.params.textAlign = getStringParamFromTemplateRow(this._row, "text_align", null) as any;
    this.params.buttonAlign = getStringParamFromTemplateRow(
      this._row,
      "button_align",
      "center"
    ) as any;
    this.params.icon = getStringParamFromTemplateRow(this._row, "icon", null);
    this.params.iconSecondary = getStringParamFromTemplateRow(
      this._row,
      "icon_secondary_asset",
      null
    );
    this.params.iconAlign = getStringParamFromTemplateRow(this._row, "icon_align", "left") as any;
  }

  /** Determine if the button is inside a display group with the style "two_columns" */
  private isTwoColumns(): boolean {
    const displayGroupElement = this.elRef.nativeElement.closest(".display-group-wrapper");
    if (displayGroupElement) {
      return displayGroupElement.classList.contains("two_columns");
    } else {
      return false;
    }
  }

  private populateVariantMap() {
    const variantArray = this.params.variant.split(" ");
    this.variantMap = {
      cardPortrait: variantArray.includes("card-portrait"),
    };
  }
}
