import { PlhParentPointCounterComponent } from "./parent-point-counter/parent-point-counter.component";
import { PlhParentPointBoxComponent } from "./parent-point-box/parent-point-box.component";
import { PlhModuleListItemComponent } from "./plh-kids-kw/components/module-list-item/module-list-item.component";

export { PlhParentPointCounterComponent, PlhParentPointBoxComponent, PlhModuleListItemComponent };

export const PLH_COMPONENTS = [
  PlhParentPointCounterComponent,
  PlhParentPointBoxComponent,
  PlhModuleListItemComponent,
];

export const PLH_COMPONENT_MAPPING = {
  parent_point_counter: PlhParentPointCounterComponent,
  parent_point_box: PlhParentPointBoxComponent,
  plh_module_list_item: PlhModuleListItemComponent,
};

export type PLHComponentName = keyof typeof PLH_COMPONENT_MAPPING;
