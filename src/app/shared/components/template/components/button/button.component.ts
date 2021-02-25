import {Component, Input, OnInit} from '@angular/core';
import {ITemplateComponent} from "../tmpl.component";
import {FlowTypes} from "../../../../model";
import {getStringParamFromTemplateRow, getNumberParamFromTemplateRow} from "../../../../utils";

@Component({
    selector: 'plh-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class ButtonComponent implements ITemplateComponent, OnInit {
    @Input() row: FlowTypes.TemplateRow;
    @Input() template: FlowTypes.Template;
    @Input() localVariables: { [name: string]: any };
    color: string = 'primary';
    width: number;
    height: number;

    constructor() {}

    ngOnInit() {
        this.getParams();
    }

    getParams() {
        if (this.row && this.row.parameter_list.length) {
            this.color = getStringParamFromTemplateRow(this.row, 'color',  'primary');
            this.width = getNumberParamFromTemplateRow(this.row, 'width', 172);
            this.height = getNumberParamFromTemplateRow(this.row, 'height', 62);
        }
    }
}
