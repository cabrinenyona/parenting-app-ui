import { Component, computed, input, signal } from "@angular/core";
import { IAnswerListItem } from "src/app/shared/utils";
import { ModalController } from "@ionic/angular";

@Component({
  selector: "combo-box-search",
  templateUrl: "./combo-box-search.component.html",
  styleUrls: ["./combo-box-search.component.scss"],
})
export class ComboBoxSearchComponent {
  public answerOptions = input.required<IAnswerListItem[]>();
  public title = input<string>();
  public selectedValue = input<string>();

  public searchTerm = signal("");

  public filteredOptions = computed(() =>
    this.answerOptions().filter((options) =>
      options.text.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );

  public isSelected(item: IAnswerListItem) {
    return this.selectedValue() === item.name;
  }

  constructor(private modalController: ModalController) {}

  public select(item: IAnswerListItem) {
    this.closeModal({ answer: item });
  }

  public search(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  public cancel() {
    let selectedItem = this.answerOptions().find((item) => item.name === this.selectedValue());
    this.closeModal({ answer: selectedItem });
  }

  private closeModal(value) {
    setTimeout(async () => {
      await this.modalController.dismiss(value);
    }, 50);
  }
}
