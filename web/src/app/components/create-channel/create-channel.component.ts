import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, Form } from '@angular/forms';

@Component({
  selector: 'app-create-channel',
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.css']
})
export class CreateChannelComponent implements OnInit, OnDestroy {

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.createForm();
  }

  ngOnDestroy() {
  }

  private createForm() {
    this.form = this.formBuilder.group({
      channel: [null, [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern('[A-Za-z0-9]*')]]
    });
  }

  create() {
    const channel = this.form.get('channel').value;
    console.log('create: ' + channel);
  }
}
