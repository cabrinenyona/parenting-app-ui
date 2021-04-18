import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntil, takeWhile } from "rxjs/operators";
import { BehaviorSubject, Subject } from "scripts/node_modules/rxjs";
import { TEMPLATE } from "../../services/data/data.service";
import { arrayToHashmap, mergeObjectArrays } from "../../utils";
import { FlowTypes, ITemplateContainerProps } from "./models";
import { TemplateNavService } from "./services/template-nav.service";
import { TemplateVariablesService } from "./services/template-variables.service";
import { TemplateService } from "./services/template.service";

/** Logging Toggle - rewrite default functions to enable or disable inline logs */
const SHOW_DEBUG_LOGS = true;
const log = SHOW_DEBUG_LOGS ? console.log : () => null;
const log_group = SHOW_DEBUG_LOGS ? console.group : () => null;
const log_groupEnd = SHOW_DEBUG_LOGS ? console.groupEnd : () => null;

@Component({
  selector: "plh-template-container",
  templateUrl: "./template-container.component.html",
  styleUrls: ["./template-container.component.scss"],
})
export class TemplateContainerComponent implements OnInit, OnDestroy, ITemplateContainerProps {
  /** unique instance_name of template */
  @Input() name: string;
  /** flow_name of template for lookup */
  @Input() templatename: string;
  @Input() parent?: TemplateContainerComponent;
  @Input() row?: FlowTypes.TemplateRow;
  children: { [name: string]: TemplateContainerComponent } = {};

  /** Templates may inherit variables from a parent for initialisation.
   * If set from a row keeps full reference to row, if set as a value will only have {value} field */
  localVariables: any = {};

  /**
   * declared properties to be inherited by child templates during their own initialisation
   * maybe declared 1 or more levels deep (e.g. templateA.templateB.templateC)
   * */
  childOverrides: { [template_instance: string]: FlowTypes.TemplateRow };

  template: FlowTypes.Template;
  /** track path to template from top parent (not currently used) */

  templateBreadcrumbs: string[] = [];
  componentDestroyed$ = new Subject();
  debugMode: boolean;
  private actionsQueue: FlowTypes.TemplateRowAction[] = [];
  private actionsQueueProcessing$ = new BehaviorSubject<boolean>(false);

  constructor(
    private templateService: TemplateService,
    private templateVariables: TemplateVariablesService,
    public router: Router,
    public route: ActivatedRoute,
    private templateNavService: TemplateNavService
  ) {}

  async ngOnInit() {
    this.initialiseTemplate();
    this.subscribeToQueryParamChanges();
    // const { name, templatename, parent, row, templateBreadcrumbs } = this;
    // log("template initialised", { name, templatename, parent, row, templateBreadcrumbs });
  }

  ngOnDestroy(): void {
    // allow any subscriptions to be removed by binding to these events (avoid memory leak)
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.unsubscribe();
  }

  /***************************************************************************************
   *  Action Handling
   **************************************************************************************/
  /** Public method to add actions to processing queue and process */
  public async handleActions(
    actions: FlowTypes.TemplateRowAction[] = [],
    _triggeredBy: FlowTypes.TemplateRow
  ) {
    const unhandledActions = await this.handleActionsInterceptor(actions);
    unhandledActions.forEach((action) => this.actionsQueue.push({ ...action, _triggeredBy }));
    const res = await this.processActionQueue();
    await this.handleActionsCallback([...unhandledActions], res);
    if (!this.parent) {
      await this.templateNavService.handleNavActionsFromChild(actions, this);
    }
  }
  /** Optional method child component can add to handle post-action callback */
  public async handleActionsCallback(actions: FlowTypes.TemplateRowAction[], results: any) {}

  /** Optional method child component can filter action list to handle outside of default handlers */
  public async handleActionsInterceptor(
    actions: FlowTypes.TemplateRowAction[]
  ): Promise<FlowTypes.TemplateRowAction[]> {
    return actions;
  }

  /**
   * To avoid actions potentially trying to write to same db records at the same time,
   * all actions are added to a queue and processed in order of addition
   */
  private async processActionQueue() {
    const processedActions = [];
    // start the queue if it is not already running
    if (!this.actionsQueueProcessing$.value) {
      log_group(`Process Actions - ${this.name}`, [...this.actionsQueue]);
      this.actionsQueueProcessing$.next(true);
      while (this.actionsQueue.length > 0) {
        const action = this.actionsQueue[0];
        await this.processAction(action);
        this.actionsQueue.shift();
        processedActions.push(action);
      }
      this.actionsQueueProcessing$.next(false);
      log_groupEnd();
    }
    // resolve once full queue processed
    await this.actionsQueueProcessing$.pipe(takeWhile((v) => v === true)).toPromise();
    // once all actions have been processed re-render rows
    if (processedActions.length > 0) {
      this.processRows(this.template.rows);
    }
  }
  private async processAction(action: FlowTypes.TemplateRowAction) {
    let { action_id, args } = action;
    let [key, value] = args;

    switch (action_id) {
      case "set_local":
        log("[SET LOCAL]", { key, value });
        return this.setLocalVariable(key, value);
      case "set_global":
        log("[SET GLOBAL]", key, value);
        return this.templateService.setGlobal(key, value);
      case "go_to":
        return this.templateNavService.handleNavAction(action, this);
      case "pop_up":
        return this.templateNavService.handlePopupAction(action, this);
      case "set_field":
        log("[SET FIELD]", key, value);
        return this.templateService.setField(key, value);
      case "set_theme":
        return this.templateService.setTheme(this.template, "set_theme", action.args);
      case "emit":
        const [emit_value, emit_from] = args;
        let container: TemplateContainerComponent = this;
        if (emit_from) {
          // emit from the named template container instead of this one if specified (assumed sibling of current)
          const targetContainer = container.children[emit_from];
          if (targetContainer) {
            action.args = [emit_value];
            container = targetContainer;
          }
        }
        let { parent, row, name, template } = container;
        if (emit_value === "completed") {
          // write completions to the database for data tracking
          await this.templateService.recordEvent(template, "emit", emit_value);
        }
        if (parent) {
          // continue to emit any actions to parent where defined
          log(
            "Emiting",
            emit_value,
            ` from ${row?.name || "(no row)"} to parent ${parent?.name || "(no parent)"}`,
            parent
          );
          if (row && row.action_list) {
            const actionsForEmittedEvent = row.action_list.filter((a) => a.trigger === emit_value);
            log("Excuting actions matching event ", { emit_value, actionsForEmittedEvent });
            // process in parallel, do not return/await

            // TODO - check if should be parent row or current row
            parent.handleActions(actionsForEmittedEvent, row);
          } else {
            log("No action list for row ", row, "on template name ", name);
            parent.handleActions([action], row);
          }
        }
        break;
      default:
        console.warn("No handler for action", { action_id, args });
        return;
    }
  }

  /**
   * When a child triggers the changing of a local variable... TODO
   */
  public setLocalVariable(key: string, value: any) {
    this.localVariables[key] = { value } as FlowTypes.TemplateRow;
  }

  /***************************************************************************************
   *  Template Initialisation
   **************************************************************************************/

  private initialiseTemplate() {
    // Lookup template and provide fallback
    let foundTemplate = TEMPLATE.find((t) => t.flow_name === this.templatename);
    if (!foundTemplate) {
      console.warn(`[Template] - Not Found -`, this.templatename);
      foundTemplate = NOT_FOUND_TEMPLATE(this.templatename);
    }

    // TODO - 2021-04-17 CC - is there any reason for this?
    let template: FlowTypes.Template = JSON.parse(JSON.stringify(foundTemplate));

    // if template created at top level also ensure it has a name
    template._instance_name = this.name || this.templatename;

    // TODO - unlikely to require this field anymore
    this.name = template._instance_name;

    log_group(`[Template] Init -`, this.name);

    // When processing local variables check parent in case there are any variables
    // that have already been set/overridden
    template = this.processParentOverrides(template);

    // handle main processing of template rows and variables
    template.rows = this.processRows(template.rows);

    this.template = template;
    console.log("[Template] Render", { ...template });

    // keep track of path to this template from any parents
    this.templateBreadcrumbs = [...(this.parent?.templateBreadcrumbs || []), this.name];

    // if a parent exists also provide parent reference to this as a child
    if (this.parent) {
      this.parent.children[this.name] = this;
    }
    log_groupEnd();
  }

  /**
   *
   *
   */
  private processParentOverrides(template: FlowTypes.Template) {
    const overrides = { ...this.parent?.childOverrides };
    log("[Overrides Start]", { overrides, template: { ...template } });

    // apply overrides for the existing template
    const currentOverride = overrides[template._instance_name];
    if (currentOverride) {
      const overridesByName = arrayToHashmap(currentOverride.rows, "name");
      // apply any existing overrides for each row
      // note - if overrides exist that do not match any row they will not be processed
      template.rows = template.rows.map((row) => {
        if (row.name) {
          // keep the existing row type (as by default updated rows will be 'set_variable' type)
          const override = overridesByName[row.name];
          if (override) {
            // remove any dynamic references in the current template which will now be overwritten
            const _dynamicFields = row._dynamicFields || {};
            Object.keys(_dynamicFields).forEach((key) => {
              if (override.hasOwnProperty(key)) {
                delete _dynamicFields[key];
              }
            });
            // merge the original row and override row together, preserving original row type
            // and assigning modified dynamicFields references
            const merged = { ...row, ...override, type: row.type, _dynamicFields };

            return merged;
            // remove dynamic references
          }
        }
        return row;
      });
    }
    // Rename any deeper nested overrides to omit current template name
    // e.g. if current template is template_a
    //  template_a.template_b.template_c => template_b.template_c
    //  template_a => template_a (want to retain for processing in this template)
    const nestedOverrides = {};
    Object.keys(overrides).forEach((k) => {
      if (k !== template._instance_name) {
        const childName = k.replace(`${template._instance_name}.`, "");
        nestedOverrides[childName] = overrides[k];
      }
    });
    this.childOverrides = nestedOverrides;
    log("[Overrides End]", { template: { ...template } });
    return template;
  }

  /**
   *
   *
   * TODO - a level of recursion is currently missing. Currently set_variable, set_field etc.
   * to be at top level because they are manually checked. Ideally there should be a processRows
   * function that is also called recursively to process nested rows in same way
   * (this requires localVariables being handled outside the function, or returning updated)
   */
  private processRows(rows: FlowTypes.TemplateRow[]) {
    const processedRows = [];

    // Create a variable to keep track of set_variable statements from within rows
    // Any variables inherited from parents will already have overwritten the child row statement
    // const localVariables = this.localVariables;

    rows.forEach((row) => {
      let { name, value, condition } = row;
      log("[Row start]", name, { ...row });
      // Evaluate row in context of current local state. Skip processing nested rows
      // as these could be filtered out folloing condition evaluation
      const evalContext = { localVariables: this.localVariables, template: this.template, row };
      row = this.templateVariables.evaluatePLHData(row, evalContext, ["rows"]);

      // Filter out if specified by condition. This might be string or boolean
      // depending on the parser and related calculations (so check for both)
      if (condition === (false as any) || condition === "false") {
        log("[Row end (condition)]", name);
        return;
      }

      // Update local variables where specified and filter out
      if (row.type === "set_variable") {
        this.localVariables[name] = row;
        log("[Row end (variable)]", name);
        return;
      }
      // Handle rows that set external data and filter out
      // TODO - confirm no other externally processed rows
      if (row.type === "set_field") {
        return this.templateService.setField(name, value);
      }

      if (row.rows) {
        row.rows = this.filterNestedRows(row.rows);
      }

      if (row.rows) {
        row.rows = this.extractNestedTemplates(row.rows);
      }

      // Store reference to template overrides
      if (row.type === "template") {
        row = this.processTemplateRow(row);
      }

      log("[Row end]", name, { ...row });

      processedRows.push(row);
      return;
    });

    return processedRows;
  }

  /**
   * Evaluate nested rows, again filtering on condition
   * TODO - code matches main methods, so perhaps there might be better way to handle.
   * slighly different handling as want to keep set_variable/set_field instead of processing
   * TODO - recursive calls here can be removed if handled in main methods
   */
  private filterNestedRows(rows: FlowTypes.TemplateRow[]) {
    const processedRowRows = [];
    rows.forEach((row) => {
      const rowEvalContext = { localVariables: this.localVariables, template: this.template, row };
      row = this.templateVariables.evaluatePLHData(row, rowEvalContext);
      if (row.condition === (false as any) || row.condition === "false") {
        return;
      }
      if (row.rows) {
        row.rows = this.filterNestedRows(row.rows);
      }
      processedRowRows.push(row);
    });
    rows = processedRowRows;
    return rows;
  }

  /**
   * Look through all rows and nested structures for begin template instances
   * for processing
   * TODO - recursive calls here can be removed if handled in main methods
   */
  private extractNestedTemplates(rows: FlowTypes.TemplateRow[]) {
    return rows.map((row) => {
      if (row.type === "template") {
        console.log("[Template Row] - Nested Found", { ...row });
        return this.processTemplateRow(row);
      } else {
        if (row.rows) {
          row.rows = this.extractNestedTemplates(row.rows);
        }
      }
      return row;
    });
  }
  /**
   *
   */
  private processTemplateRow(row: FlowTypes.TemplateRow) {
    const previousOverrides = this.childOverrides || {};
    log(`[Template Row Start] - ${row.name}`, { previousOverrides, row: { ...row } });

    // TODO - only the template child rows will define things to pass into the tree,
    // so needs a slight refactor (although fine for now as top level ignored)
    const newOverrides = this.extractRowOverrideTree(row);
    console.log("new overrides", { ...newOverrides });

    const mergedOverrides = newOverrides;
    Object.entries(previousOverrides).forEach(([key, previousOverride]) => {
      const newOverride = newOverrides[key];
      if (newOverride) {
        // override secondary field with previousOverride-secondary merge
        mergedOverrides[key] = this.mergeOverrideRows(previousOverride, newOverride);
      } else {
        // add new properties to secondary
        mergedOverrides[key] = previousOverride;
      }
    });
    this.childOverrides = mergedOverrides;
    log(`[Template Row End] - ${row.name}`, { ...mergedOverrides });
    // remove the child rows from further processing in this template
    row.rows = [];
    return row;
  }

  /**
   * When a row defines a template, extract a set of properties to pass to that template when it is later rendered
   * Also requires extracting any properties that will be passed to a child of that template (via nested_properties)
   * and defining within its own namespace to be inherited by the future template.
   * @see ./mocks/nested-templates.mock.ts for examples of implementation
   *
   * @param row row containing overrides, either the initial 'template' row or a child 'nested_properties' row
   * @param tree current override tree, used when calling recursively to define nested trees
   * @param namespace prefix used to define the current tree level, either the current template name or path to nested template
   */
  private extractRowOverrideTree(row: FlowTypes.TemplateRow, tree = {}, namespace?: string) {
    // use a new object so that 'delete' operations are not accidentally passed back (could use different variable name)
    row = { ...row };
    namespace = namespace || row.name;
    const { name, rows } = row;
    delete row.type; // we cannot currently override a row type (as blank rows interpreted as set_variable which might not be correct)
    delete row._dynamicFields; // remove references to dynamic fields calculated from the current template when inherited
    if (name) {
      tree[namespace] = { ...row };
      if (rows) {
        tree[namespace].rows = [];
        // repeat above process for nested_properties, which form their own namespaced trees
        rows.forEach((r) => {
          const nestedName = r.name;
          delete r.type;
          delete r._dynamicFields;
          if (r.type === "nested_properties") {
            const nestedTemplate: FlowTypes.TemplateRow = { ...r, name: nestedName };
            const nestedNamespace = `${namespace}.${nestedName}`;
            tree = this.extractRowOverrideTree(nestedTemplate, tree, nestedNamespace);
          } else {
            tree[namespace].rows.push(r);
          }
        });
      }
    }

    return tree;
  }

  /** Merge override entries by keeping all primary columns, adding secondary columns, and merging primary-secondary rows */
  private mergeOverrideRows(primary: FlowTypes.TemplateRow, secondary: FlowTypes.TemplateRow) {
    return {
      ...secondary,
      ...primary,
      rows: mergeObjectArrays(primary.rows, secondary.rows, "name"),
    };
  }

  /**
   * When using ngFor loop track by to ensure updates correctly propagated on change
   * Most important is to keep track of row value as updates to this will want UI refresh
   */
  public trackByRow(index: number, row: FlowTypes.TemplateRow) {
    return `${row.name}-${row.value}-${index}`;
  }

  /** Query params are used to track state across navigation events */
  private subscribeToQueryParamChanges() {
    this.route.queryParams
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(async (params: any) => {
        this.debugMode = params.debugMode ? true : false;
        // allow templateNavService to process actions based on query param change
        await this.templateNavService.handleQueryParamChange(params, this);
      });
  }
}

/** helper function used for dev to wait a fixed amount of time */
function _wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

const NOT_FOUND_TEMPLATE = (name: string): FlowTypes.Template => ({
  flow_name: "Template_not_found",
  flow_type: "template",
  rows: [{ type: "title", value: `Template "${name}" not found` }],
  status: "released",
});
