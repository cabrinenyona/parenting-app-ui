import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { DomController, ScrollDetail } from "@ionic/angular";
import { Subscription } from "rxjs/internal/Subscription";
import { Subject, filter, map } from "rxjs";

/** The id of the ion-content component upon which scrolling will trigger the collapse */
const SCROLL_AREA_ID = "collapseOnScrollTargetScrollArea";

@Directive({
  selector: "[plhCollapseOnScroll]",
})
export class CollapseOnScrollDirective implements OnInit, OnDestroy {
  @Input("plhCollapseOnScroll") scrollEvents$: Subject<any>;

  private hidden: boolean = false;
  private triggerDistance: number = 20;
  subscription: Subscription;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2,
    private domCtrl: DomController
  ) {}

  ngOnInit() {
    this.initStyles();
    const scrollAreaStream$ = this.scrollEvents$.pipe(
      filter(
        (scrollEvent: CustomEvent) => (scrollEvent.target as HTMLElement).id === SCROLL_AREA_ID
      ),
      map((scrollEvent) => scrollEvent.detail)
    );
    this.subscription = scrollAreaStream$.subscribe((scrollDetail: ScrollDetail) => {
      let delta = scrollDetail.deltaY;

      if (scrollDetail.currentY === 0 && this.hidden) {
        this.show();
      } else if (!this.hidden && delta > this.triggerDistance) {
        this.hide();
      } else if (this.hidden && delta < -this.triggerDistance) {
        this.show();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  initStyles() {
    this.domCtrl.write(() => {
      this.renderer.setStyle(this.element.nativeElement, "transition", "0.2s linear");
      this.renderer.setStyle(this.element.nativeElement, "height", "56px");
    });
  }

  hide() {
    this.domCtrl.write(() => {
      this.renderer.setStyle(this.element.nativeElement, "min-height", "0px");
      this.renderer.setStyle(this.element.nativeElement, "height", "0px");
      this.renderer.setStyle(this.element.nativeElement, "opacity", "0");
      this.renderer.setStyle(this.element.nativeElement, "padding", "0");
    });
    this.hidden = true;
  }

  show() {
    this.domCtrl.write(() => {
      this.renderer.setStyle(this.element.nativeElement, "height", "56px");
      this.renderer.removeStyle(this.element.nativeElement, "opacity");
      this.renderer.removeStyle(this.element.nativeElement, "min-height");
      this.renderer.removeStyle(this.element.nativeElement, "padding");
    });
    this.hidden = false;
  }
}
