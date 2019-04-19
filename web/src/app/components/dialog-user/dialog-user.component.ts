import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-dialog-user',
  templateUrl: './dialog-user.component.html',
  styleUrls: ['./dialog-user.component.css']
})
export class DialogUserComponent implements OnInit {

  userFormControl: FormGroup;
  previousUserData: any;

  constructor(public dialogRef: MatDialogRef<DialogUserComponent>,
  @Inject(MAT_DIALOG_DATA) public params: any) {
    this.previousUserData = params;
  }

  ngOnInit() {
    this.userFormControl = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      nickname: new FormControl(this.params.username, [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -]{1,18})([^- ])$')]),
      channel: new FormControl(this.params.channel, [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -.]{1,18})([^- ])$')]),
      secret: new FormControl(this.params.secret, Validators.required)
    });
  }

  public onSave(): void {
    if (this.userFormControl.invalid) {
      return;
    }

    this.dialogRef.close({
      username: this.userFormControl.get('nickname').value,
      channel: this.userFormControl.get('channel').value,
      secret: this.userFormControl.get('secret').value,
      dialogType: this.params.dialogType,
      previousUserData: this.previousUserData
    });
  }

}
