/* eslint-disable no-underscore-dangle */
import CreateElement from "@components/CreateElement";
import type { DeleteReasonSubCategoryType } from "@root/controllers/System";
import HideElement from "@root/helpers/HideElement";
import { Icon, Select, Text } from "@style-guide";
import SetProps from "@style-guide/helpers/SetProps";
import type QuickActionButtonsClassType from "../QuickActionButtons";
import ActionButton from "./ActionButton";

export default class MoreButton extends ActionButton {
  private reasonSelect: Select;
  optionEntries: {
    reason: DeleteReasonSubCategoryType;
    element: HTMLOptionElement;
  }[];

  constructor(main: QuickActionButtonsClassType) {
    super(
      main,
      "left",
      {
        type: "solid-gray",
        whiteBg: true,
        iconOnly: true,
        reversedOrder: true,
        title: System.data.locale.common.seeMoreDeletionReasons,
        icon: new Icon({
          size: 32,
          type: "more",
          color: "adaptive",
        }),
      },
      Text({
        tag: "div",
        size: "small",
        weight: "bold",
        children: System.data.locale.common.seeMoreDeletionReasons,
      }),
    );

    SetProps(this.button.element, {
      onClick: this.ShowDropdown.bind(this),
      onMouseEnter: this.ShowDropdown.bind(this),
      onTouchStart: this.ShowDropdown.bind(this),
    });
  }

  HideDropdown() {
    if (this.main.moderating) return;

    this.container.append(this.button.element);
    HideElement(this.reasonSelect?.element);
    this.buttonTippy.hide();
  }

  ShowDropdown() {
    if (this.main.moderating || !this.button.IsIconOnly()) return;

    if (!this.reasonSelect) {
      this.RenderDropdown();
    }

    HideElement(this.button.element);
    this.container.append(this.reasonSelect.element);
  }

  RenderDropdown() {
    this.optionEntries = [];

    const optionChildren = [];
    const reasonCategories = Object.values(
      System.data.Brainly.deleteReasons.question,
    );

    reasonCategories.forEach(reasonCategory => {
      let group;

      if (reasonCategories.length > 1) {
        group = CreateElement({
          tag: "optgroup",
          label: reasonCategory.text,
        });

        optionChildren.push(group);
      }

      reasonCategory.subcategories.forEach(reason => {
        if (!("id" in reason)) return;

        const optionElement = CreateElement({
          tag: "option",
          children: reason.title,
        });

        this.optionEntries.push({
          reason,
          element: optionElement,
        });

        if (group) group.append(optionElement);
        else optionChildren.push(optionElement);
      });
    });

    this.reasonSelect = new Select({
      onMouseLeave: this.HideDropdown.bind(this),
      onChange: this.ReasonSelected.bind(this),
      options: [
        {
          selected: true,
          text: System.data.locale.common.chooseAnOption,
        },
        ...optionChildren,
      ],
    });
  }

  async ReasonSelected() {
    const { selectedOptions } = this.reasonSelect.select;

    if (!selectedOptions.length) return;

    const selectedOption = selectedOptions[0];
    const { reason } =
      this.optionEntries.find(entry => entry.element === selectedOption) || {};

    if (!reason) return;

    await this.Selected();
    this.main.Moderating();

    const confirmMessage = System.data.locale.common.moderating.doYouWantToDeleteWithReason
      .replace("%{reason_title}", reason.title)
      .replace("%{reason_message}", reason.text);

    if (!confirm(confirmMessage)) {
      this.main.NotModerating();

      return;
    }

    const giveWarning = System.canBeWarned(reason.id);

    this.main.DeleteContent({
      model_id: this.main.content.databaseId,
      reason_id: reason.category_id,
      reason: reason.text,
      reason_title: reason.title,
      give_warning: giveWarning,
      take_points: giveWarning,
      return_points: giveWarning,
    });
  }
}
