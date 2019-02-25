import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, Form } from '@angular/forms';

@Component({
  selector: 'app-join-channel',
  templateUrl: './join-channel.component.html',
  styleUrls: ['./join-channel.component.css']
})
export class JoinChannelComponent implements OnInit, OnDestroy {

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.createForm();
  }

  ngOnDestroy() {
  }

  private createForm() {
    const validators = [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern('[A-Za-z0-9]*')];
    this.form = this.formBuilder.group({
      channel: [null, validators],
      name: [null, validators]
    });
  }

  join() {
    const channel = this.form.get('channel').value;
    const name = this.form.get('name').value;
    console.log(name + ' is joining ' + channel);
  }
}
