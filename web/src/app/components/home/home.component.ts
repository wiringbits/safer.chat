import { Component, OnInit, AfterViewInit} from '@angular/core';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  scrolled = false;
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // when scrolled,this event is fired
    fromEvent(document, 'scroll').subscribe(event => {
      this.scrolled = document.scrollingElement.scrollTop > 10;
    });
  }
}
