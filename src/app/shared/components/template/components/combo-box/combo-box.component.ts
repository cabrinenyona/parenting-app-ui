import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FlowTypes } from "../../../../model";
import { ModalController } from "@ionic/angular";
import { ComboBoxModalComponent } from "./combo-box-modal/combo-box-modal.component";
import {
  getBooleanParamFromTemplateRow,
  getParamFromTemplateRow,
  getStringParamFromTemplateRow,
  parseAnswerList,
} from "src/app/shared/utils";
import { TemplateBaseComponent } from "../base";
import { ITemplateRowProps } from "../../models";
import { TemplateService } from "../../services/template.service";
import { ReplaySubject } from "rxjs";
import { objectToArray } from "../../utils";

@Component({
  selector: "plh-combo-box",
  templateUrl: "./combo-box.component.html",
  styleUrls: ["./combo-box.component.scss"],
})
export class TmplComboBoxComponent
  extends TemplateBaseComponent
  implements ITemplateRowProps, OnInit, OnDestroy
{
  @Input() template: FlowTypes.Template;
  placeholder: string;
  prioritisePlaceholder: boolean;
  style: string;
  text = "";
  customAnswerSelected: boolean = false;
  private componentDestroyed$ = new ReplaySubject(1);
  constructor(private modalController: ModalController, private templateService: TemplateService) {
    super();
  }

  ngOnInit(): void {
    this.getParams();
    const answerList = parseAnswerList(getParamFromTemplateRow(this._row, "answer_list", []));

    this.customAnswerSelected =
      answerList.length > 0 && this._row.value
        ? !answerList.find((x) => x.name === this._row.value)
        : false;

    this.text = "";
    if (this._row.value) {
      this.text =
        this._row.value === "other"
          ? this._row.parameter_list["customAnswer"]
          : answerList.find((answerListItem) => answerListItem.name === this._row.value)?.text;
    }
  }

  getParams() {
    this.placeholder = getStringParamFromTemplateRow(this._row, "placeholder", "");
    this.prioritisePlaceholder = getBooleanParamFromTemplateRow(
      this._row,
      "prioritise_placeholder",
      false
    );
    this.style = getStringParamFromTemplateRow(this._row, "style", "");
  }

  async openModal() {
    const modal = await this.modalController.create({
      component: ComboBoxModalComponent,
      cssClass: "combo-box-modal",
      componentProps: {
        row: this._row,
        template: this.template,
        selectedValue: this.customAnswerSelected ? this.text : this._row.value,
        customAnswerSelected: this.customAnswerSelected,
        style: this.style,
      },
      showBackdrop: false,
    });

    modal.onDidDismiss().then(async (data) => {
      this.prioritisePlaceholder = false;
      const value = data?.data?.answer?.name;
      console.log("value", value);
      this.text = data?.data?.answer?.text;
      this.customAnswerSelected = data?.data?.customAnswerSelected;
      if (this.customAnswerSelected) {
        this._row.parameter_list["customAnswer"] = data?.data?.answer?.text;
      } else {
        this._row.parameter_list["customAnswer"] = null;
      }
      await this.setValue(value);
      await this.triggerActions("changed");
      console.log("this._row.value", this._row.value);
    });
    await modal.present();
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}
