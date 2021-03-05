import { Component, Input } from "@angular/core";
import { FlowTypes, ITemplateRowProps } from "../models";
import { TemplateContainerComponent } from "../template-container.component";

@Component({
  selector: "plh-template-component-base",
  template: ``,
  styleUrls: ["./tmpl-components-common.scss"],
})
/**
 * Common methods and data made available to all other components
 * By default it provides input setters, and mapping to local variables
 *
 * Other components can either extend this one, or implement ITemplateRowProps
 * in their own way.
 * Note, if extending the base component access to data is provided by the declared properties,
 * e.g. `_row`, `_localVariables`
 */
export class TemplateBaseComponent implements ITemplateRowProps {
  _row: FlowTypes.TemplateRow;
  _localVariables: { [name: string]: any };
  /** specific data used in component rendering */
  @Input() set row(row: FlowTypes.TemplateRow) {
    this._row = row;
  }
  /** compiled list of variables used across all template rows */
  @Input() set localVariables(localVariables: { [name: string]: any }) {
    this._localVariables = localVariables;
  }
  /** reference to parent template container - does not have setter as should remain static */
  @Input() parent: TemplateContainerComponent;
  constructor() {}

  /** Whenever actions are triggered handle in the parent template component */
  triggerActions() {
    this.parent.handleActions(this._row.action_list);
  }
}
