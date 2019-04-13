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
  previousUsername: string;

  constructor(public dialogRef: MatDialogRef<DialogUserComponent>,
  @Inject(MAT_DIALOG_DATA) public params: any) {
    this.previousUsername = params.username ? params.username : undefined;
  }

  ngOnInit() {
    this.userFormControl = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      username: new FormControl('', Validators.required),
      channel: new FormControl('', Validators.required),
      secret: new FormControl('', Validators.required)
    });
  }

  public onSave(): void {
    this.dialogRef.close({
      username: this.userFormControl.get('username').value,
      channel: this.userFormControl.get('channel').value,
      secret: this.userFormControl.get('secret').value,
      dialogType: this.params.dialogType,
      previousUsername: this.previousUsername
    });
  }

}
