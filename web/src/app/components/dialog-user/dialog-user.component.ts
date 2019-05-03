import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';


@Component({
  selector: 'app-dialog-user',
  templateUrl: './dialog-user.component.html',
  styleUrls: ['./dialog-user.component.css']
})
export class DialogUserComponent implements OnInit {

  userFormControl: FormGroup;
  previousUserData: any;

  constructor(public dialogRef: MatDialogRef<DialogUserComponent>,
    @Inject(MAT_DIALOG_DATA) public params: any,
    private chatService: ChatService) {
    this.previousUserData = params;
  }

  ngOnInit() {
    this.userFormControl = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      nickname: new FormControl(this.params.user.nickname, [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -]{1,18})([^- ])$')]),
      channel: new FormControl(this.params.channel.name, [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -.]{1,18})([^- ])$')]),
      secret: new FormControl(this.params.channel.secret, Validators.required)
    });
  }

  public onJoin(): void {
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
